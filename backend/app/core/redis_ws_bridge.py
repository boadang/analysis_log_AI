# backend/app/core/redis_ws_bridge.py

import json
import redis
import logging

logger = logging.getLogger(__name__)

REDIS_URL = "redis://localhost:6379"


def _publish(channel: str, payload: dict):
    try:
        r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        r.publish(channel, json.dumps(payload))
        logger.info(f"[REDIS-PUB] {channel} -> {payload.get('type')}")
    except Exception as e:
        logger.error(f"[REDIS-PUB] Failed {channel}: {e}")


# =========================
# Hunt WS
# =========================
def publish_to_hunt(hunt_id: int, payload: dict):
    """
    Channel: hunt_ws:{hunt_id}
    """
    channel = f"hunt_ws:{hunt_id}"
    _publish(channel, payload)

