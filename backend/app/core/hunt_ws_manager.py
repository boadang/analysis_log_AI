# backend/app/core/hunt_ws_manager.py

import asyncio
import json
import logging
import redis.asyncio as redis
from fastapi import WebSocket

logger = logging.getLogger(__name__)

REDIS_URL = "redis://localhost:6379"
REDIS_PATTERN = "hunt_ws:*"


class HuntWSManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}
        self.redis_client = None
        self.pubsub = None
        self.listener_task = None

    async def connect(self, hunt_id: int, websocket: WebSocket):
        self.active_connections.setdefault(hunt_id, []).append(websocket)
        logger.info(f"✅ WS connected hunt={hunt_id}")

    async def disconnect(self, hunt_id: int, websocket: WebSocket):
        if hunt_id in self.active_connections:
            self.active_connections[hunt_id].remove(websocket)
            if not self.active_connections[hunt_id]:
                del self.active_connections[hunt_id]

    async def broadcast(self, hunt_id: int, message: dict):
        for ws in self.active_connections.get(hunt_id, []):
            await ws.send_json(message)

    async def _redis_loop(self):
        self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.psubscribe(REDIS_PATTERN)

        logger.info(f"[HUNT-WS] Subscribed {REDIS_PATTERN}")

        async for msg in self.pubsub.listen():
            if msg["type"] != "pmessage":
                continue

            hunt_id = int(msg["channel"].split(":", 1)[1])
            data = json.loads(msg["data"])
            await self.broadcast(hunt_id, data)

    async def start_redis_listener(self):
        if not self.listener_task:
            logger.info("[HUNT-WS] 🚀 Starting Redis listener")
            self.listener_task = asyncio.create_task(self._redis_loop())

    async def stop_redis_listener(self):
        if self.listener_task:
            self.listener_task.cancel()
            self.listener_task = None


ws_manager = HuntWSManager()
