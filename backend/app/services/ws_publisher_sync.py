# backend/app/services/ws_publisher_sync.py

import json
import redis
from app.core.config import settings
from app.core.ws_manager import job_ws_manager

# ==========================
# Redis sync client (Celery)
# ==========================
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    decode_responses=True
)

CHANNEL_PREFIX = "job"

def _publish(job_id: str, payload: dict):
    try:
        channel = f"{CHANNEL_PREFIX}:{job_id}"
        redis_client.publish(channel, json.dumps(payload))
        print(f"[WS-SYNC] Published {payload.get('type')} to {channel}")
    except Exception as e:
        print(f"[WS-SYNC] Redis publish error: {e}")

# ==========================
# Public publisher APIs
# ==========================
def publish_status(job_id: str, status: str):
    _publish(job_id, {"type": "status", "status": status})

def publish_log(job_id: str, line: str):
    _publish(job_id, {"type": "log", "line": line})

def publish_summary(job_id: str, summary: dict):
    _publish(job_id, {"type": "summary", "summary": summary or {}})

def publish_timeline(job_id: str, timeline: list):
    _publish(job_id, {"type": "timeline", "timeline": timeline or []})

def publish_completed(job_id: str, job_data: dict):
    """
    Job completed event for WS clients
    """
    try:
        _publish(job_id, {
            "type": "completed",
            "status": "completed",
            "summary": job_data.get("summary", {}),
            "timeline": job_data.get("timeline", []),
            "stats": job_data.get("stats", {"total_logs": 0, "detected_threats": 0})
        })
    except Exception as e:
        print(f"[WS ERROR] publish_completed job={job_id}: {e}")

def publish_error(job_id: str, message: str):
    _publish(job_id, {"type": "error", "message": message})
