import json
import redis

_redis = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True,
)

def hunt_ws_emit(hunt_id: int, payload: dict):
    _redis.publish(
        f"hunt:{hunt_id}",
        json.dumps(payload),
    )
