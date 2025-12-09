# backend/app/tasks/analysis_worker.py
import os
import re
import json
import requests
from datetime import datetime
from collections import Counter
from typing import List, Optional

from celery import shared_task
from app.database.postgres import SessionLocal
from app.utils.ollama_client import call_ollama
from app.models import Analysis, User


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

def read_logs(file_path: str) -> List[str]:
    """Đọc file log .txt / .log"""
    if not os.path.exists(file_path):
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f.readlines() if line.strip()]


def build_prompt(logs: List[str]) -> str:
    """Ghép log thành prompt gửi cho AI"""
    joined_logs = "\n".join(logs[:2000])  # tránh prompt quá lớn

    return f"""
Bạn là AI phân tích an ninh. Hãy đọc các log sau và phát hiện các hành vi tấn công.

Logs:
{joined_logs}

Yêu cầu:
- Phát hiện threat.
- Output JSON dạng:
  [
    {{"log": "...", "is_threat": true/false, "reason": "..."}}
  ]
"""

def parse_ai_result(raw_text: str) -> list:
    """
    Parse thông minh chống lỗi:
    - Tìm tất cả JSON array chuẩn [ ... ]
    - Lấy mảng JSON dài nhất (thường đúng nhất)
    - Sửa lỗi cơ bản rồi parse
    """

    if not raw_text:
        return []

    # Xóa code block ```json ``` nếu có
    raw_text = raw_text.replace("```json", "").replace("```", "").strip()

    # Regex tìm tất cả mảng JSON
    json_arrays = re.findall(r"\[\s*{.*?}\s*]", raw_text, flags=re.DOTALL)

    if not json_arrays:
        return []

    # Lấy mảng JSON dài nhất — xác suất chính xác cao nhất
    candidate = max(json_arrays, key=len)

    # Fix lỗi phổ biến
    fixed = (
        candidate
        .replace("\n", " ")
        .replace("\t", " ")
        .replace(",]", "]")
        .replace(", }", " }")
        .strip()
    )

    # Nếu mảng không kết thúc đúng → cố gắng sửa
    if not fixed.endswith("]"):
        fixed += "]"

    # Parse JSON
    try:
        data = json.loads(fixed)
        if isinstance(data, list):
            return data
    except Exception as err:
        print("[Parse Error] ", err)
        return []

    return []

@shared_task
def run_analysis_task(
    analysis_id: int,
    file_path: str,
    model_name: str,
    time_range_from: Optional[str] = None,
    time_range_to: Optional[str] = None,
    device_ids: Optional[List[int]] = None
):
    """Worker chuẩn cho AI log analysis"""
    if device_ids is None:
        device_ids = []

    db = SessionLocal()
    try:
        job: Analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not job:
            return f"Job {analysis_id} not found"

        job.status = "running"
        db.commit()

        print("[Worker] Starting analysis: Read Logs ", analysis_id)
        logs = read_logs(file_path)

        print(f"[Worker] Logs read: {len(logs)} lines")
        # 2. Build prompt
        prompt = build_prompt(logs)
        print(f"[Worker] Building prompt: {prompt}")

        # 3. Call AI
        output_text = call_ollama(model_name, prompt)
        print(f"[Worker] Call AI: {prompt} and {model_name}")

        # DEBUG cho biết AI trả về cái gì
        print("\n\n========== AI RAW ==========")
        print(output_text[:1500])
        print("======== END AI RAW ========\n\n")

        # 4. Parse result
        parsed = parse_ai_result(output_text)
        print(f"[Worker] Parse AI result: {len(parsed)} items")

        # 5. Thống kê cơ bản
        threat_count = sum(1 for item in parsed if item.get("is_threat"))
        reason_stats = Counter(item["reason"] for item in parsed if item.get("is_threat"))

        # 6. Update DB
        job.total_logs = len(logs)
        job.detected_threats = threat_count
        job.status = "completed"
        job.finished_at = datetime.utcnow()
        db.commit()

        print(f"[Worker] Analysis completed: {analysis_id}, total_logs={len(logs)}, threats={threat_count}")
        print(f"[Worker] Threat reasons: {dict(reason_stats)}")

        return {
            "analysis_id": analysis_id,
            "total_logs": len(logs),
            "detected_threats": threat_count,
            "reason_stats": dict(reason_stats)
        }

    except Exception as err:
        job = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if job:
            job.status = "failed"
            db.commit()
        print(f"[Worker] Analysis failed: {analysis_id}, error: {err}")
        return {"error": str(err)}

    finally:
        db.close()
