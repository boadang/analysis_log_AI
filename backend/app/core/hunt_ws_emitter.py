import json
import redis
import logging

logger = logging.getLogger(__name__)

REDIS_URL = "redis://localhost:6379"


def publish_to_hunt(hunt_id: int, payload: dict):
    """
    Emit hunt event → Redis → WS
    """
    try:
        r = redis.from_url(
            REDIS_URL,
            decode_responses=True
        )
        channel = f"hunt:{hunt_id}"
        r.publish(channel, json.dumps(payload))

        logger.info(
            f"📤 [HUNT-EMIT] hunt={hunt_id} type={payload.get('type')}"
        )

    except Exception as e:
        logger.error(f"❌ [HUNT-EMIT] Failed: {e}")
