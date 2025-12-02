# backend/app/tasks/analysis_worker.py
import requests
from celery import shared_task
from datetime import datetime
from app.database.postgres import SessionLocal
from app.models.AnalysisJob import Analysis
from collections import Counter
import json
import re
import os

OLLAMA_URL = "http://localhost:11434/api/generate"


def read_logs(file_path: str) -> list[str]:
    """Đọc file log .txt / .log"""
    if not os.path.exists(file_path):
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f.readlines() if line.strip()]


def build_prompt(logs: list[str]) -> str:
    """Ghép log thành prompt gửi cho AI"""
    joined_logs = "\n".join(logs[:2000])  # tránh prompt quá to

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


def call_ollama(model_name: str, prompt: str) -> str:
    """Gửi prompt đến Ollama"""
    response = requests.post(
        OLLAMA_URL,
        json={"model": model_name, "prompt": prompt}
    )
    response.raise_for_status()
    return response.json().get("response", "")


def parse_ai_result(raw_text: str) -> list[dict]:
    """Lấy output AI → parse thành list dict"""
    json_pattern = r"\[\s*{.*?}\s*]"
    match = re.search(json_pattern, raw_text, re.DOTALL)
    if not match:
        return []

    try:
        data = json.loads(match.group(0))
        if isinstance(data, list):
            return data
    except Exception:
        pass
    return []


@shared_task
def run_analysis_task(analysis_id: int, file_path: str, model_name: str):
    """Worker chuẩn cho AI log analysis"""
    db = SessionLocal()
    try:
        job: Analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not job:
            return f"Job {analysis_id} not found"

        job.status = "running"
        db.commit()

        # 1. Đọc log
        logs = read_logs(file_path)

        # 2. Build prompt
        prompt = build_prompt(logs)

        # 3. Call AI
        output_text = call_ollama(model_name, prompt)

        # 4. Parse result
        parsed = parse_ai_result(output_text)

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

        return {"analysis_id": analysis_id, "total_logs": len(logs), "detected_threats": threat_count, "reason_stats": dict(reason_stats)}

    except Exception as err:
        job = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if job:
            job.status = "failed"
            db.commit()
        print(f"[Worker] Analysis failed: {analysis_id}, error: {err}")
        return {"error": str(err)}

    finally:
        db.close()
