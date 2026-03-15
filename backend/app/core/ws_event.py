# backend/app/core/ws_event.py
import redis
import json

REDIS_URL = "redis://localhost:6379"
CHANNEL = "analysis_ws"

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def publish_ws_event(job_id: str, payload: dict):
    r.publish(CHANNEL, json.dumps({
        "job_id": str(job_id),
        "payload": payload
    }))
