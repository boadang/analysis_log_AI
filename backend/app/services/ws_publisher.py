# backend/app/services/ws_publisher.py
from typing import Dict, List, Any
import json
import redis.asyncio as redis

REDIS_URL = "redis://localhost:6379/0"

# Singleton Redis client
_redis_client = None

async def get_redis():
    """Get or create Redis client"""
    global _redis_client
    if _redis_client is None:
        _redis_client = await redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        print("[WS-PUB] ✅ Redis client initialized")
    return _redis_client

async def _publish(job_id: int, payload: dict):
    """Internal: Publish message to Redis channel"""
    try:
        r = await get_redis()
        channel = f"job:{job_id}"
        message = json.dumps(payload)
        
        await r.publish(channel, message)
        
        print(f"[WS-PUB] 📤 Published to {channel}: {payload.get('type')}")
    except Exception as e:
        print(f"[WS-PUB] ❌ Redis publish error: {e}")
        import traceback
        traceback.print_exc()


# Job status
async def ws_publish_status(job_id: int, status: str):
    print(f"[WS-PUB] 🔄 Publishing status={status} for job={job_id}")
    await _publish(job_id, {
        "type": "status",
        "status": status
    })


# Log streaming
async def ws_publish_log(job_id: int, line: str):
    await _publish(job_id, {
        "type": "log",
        "line": line
    })


# Summary update
async def ws_publish_summary(job_id: int, summary: Dict[str, Any]):
    print(f"[WS-PUB] 📊 Publishing summary for job={job_id}: {summary}")
    await _publish(job_id, {
        "type": "summary",
        "summary": summary
    })


# Timeline update
async def ws_publish_timeline(job_id: int, timeline: List[Dict[str, Any]]):
    print(f"[WS-PUB] 📅 Publishing timeline for job={job_id}: {len(timeline)} events")
    await _publish(job_id, {
        "type": "timeline",
        "timeline": timeline
    })


# Job completed
async def ws_publish_completed(job_id: int, stats: Dict[str, Any]):
    print(f"[WS-PUB] ✅ Publishing completed for job={job_id}: {stats}")
    # 🔥 DON'T send full summary/timeline - just signal completion
    await _publish(job_id, {
        "type": "completed",
        "status": "completed",
        "stats": {
            "total_logs": stats.get("total_logs", 0),
            "detected_threats": stats.get("detected_threats", 0)
        }
    })


# Job failed
async def ws_publish_error(job_id: int, message: str):
    print(f"[WS-PUB] ❌ Publishing error for job={job_id}: {message}")
    await _publish(job_id, {
        "type": "error",
        "message": message
    })