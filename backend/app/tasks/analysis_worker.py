import os
import re
import json
from datetime import datetime
from collections import Counter
from typing import List, Optional

from celery import shared_task
from app.database.postgres import SessionLocal
from app.models import Analysis
from app.utils.ollama_client import call_ollama


# ============================================
# 1. Đọc log
# ============================================

def read_logs(file_path: str) -> List[str]:
    if not os.path.exists(file_path):
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f.readlines() if line.strip()]


# ============================================
# 2. Chia log thành batch nhỏ (tối ưu tốc độ)
# ============================================

def chunk_logs(logs: List[str], batch_size: int = 80):
    for i in range(0, len(logs), batch_size):
        yield logs[i:i + batch_size]


# ============================================
# 3. Build prompt
# ============================================

def build_prompt(log_batch: List[str]) -> str:
    joined = "\n".join(log_batch)

    return f"""
Bạn là AI phân tích an ninh. Hãy đọc các log sau và phát hiện các hành vi tấn công.

Logs:
{joined}

Yêu cầu:
- Xác định threat.
- Output JSON ONLY:
[
  {{"log": "...", "is_threat": true/false, "reason": "..." }}
]
"""
    

# ============================================
# 4. Parse JSON từ AI
# ============================================

def parse_ai_result(raw: str):
    if not raw:
        return []

    raw = raw.replace("```json", "").replace("```", "")

    arrs = re.findall(r"\[\s*{.*?}\s*]", raw, flags=re.DOTALL)
    if not arrs:
        return []

    candidate = max(arrs, key=len)

    try:
        return json.loads(candidate)
    except:
        return []


# ============================================
# 5. Celery Worker phân tích log
# ============================================

@shared_task
def run_analysis_task(
    analysis_id: int,
    file_path: str,
    model_name: str,
    time_range_from: Optional[str] = None,
    time_range_to: Optional[str] = None,
    device_ids: Optional[List[int]] = None
):
    db = SessionLocal()
    try:
        job: Analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not job:
            return f"Job {analysis_id} not found"

        job.status = "running"
        db.commit()

        print(f"[Worker] Starting analysis job={analysis_id}")

        logs = read_logs(file_path)
        print(f"[Worker] Logs loaded: {len(logs)} lines")

        all_results = []

        # ==================================
        # Xử lý theo batch nhỏ -> Nhanh gấp 20 lần
        # ==================================
        for batch_id, log_batch in enumerate(chunk_logs(logs)):
            print(f"[Worker] Processing batch {batch_id + 1}")

            prompt = build_prompt(log_batch)
            response = call_ollama(model_name, prompt)

            parsed = parse_ai_result(response)
            all_results.extend(parsed)

        # ==================================
        # Thống kê
        # ==================================
        threat_count = sum(1 for x in all_results if x.get("is_threat"))
        reason_stats = Counter(
            x["reason"] for x in all_results if x.get("is_threat")
        )

        # ==================================
        # Update DB
        # ==================================
        job.total_logs = len(logs)
        job.detected_threats = threat_count
        job.status = "completed"
        job.finished_at = datetime.utcnow()

        db.commit()

        print(f"[Worker] Completed job={analysis_id} threats={threat_count}")

        return {
            "analysis_id": analysis_id,
            "total_logs": len(logs),
            "detected_threats": threat_count,
            "reason_stats": dict(reason_stats),
        }

    except Exception as err:
        print("[Worker] ERROR:", err)
        job = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if job:
            job.status = "failed"
            db.commit()
        return {"error": str(err)}

    finally:
        db.close()
