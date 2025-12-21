# backend/app/core/hunt_ws_manager.py

import asyncio
import json
import logging
import redis.asyncio as redis
from fastapi import WebSocket

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)  # ✅ Thêm này để thấy log

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
        logger.info(f"✅ [HUNT-WS] Connected hunt={hunt_id} (total={len(self.active_connections[hunt_id])})")

    async def disconnect(self, hunt_id: int, websocket: WebSocket):
        if hunt_id in self.active_connections:
            self.active_connections[hunt_id].remove(websocket)
            logger.info(f"❌ [HUNT-WS] Disconnected hunt={hunt_id}")
            if not self.active_connections[hunt_id]:
                del self.active_connections[hunt_id]

    async def broadcast(self, hunt_id: int, message: dict):
        connections = self.active_connections.get(hunt_id, [])
        logger.info(f"📤 [HUNT-WS] Broadcasting to hunt={hunt_id} ({len(connections)} clients)")
        
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"❌ [HUNT-WS] Failed to send to client: {e}")

    async def _redis_loop(self):
        try:
            self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.psubscribe(REDIS_PATTERN)

            logger.info(f"✅ [HUNT-WS] Subscribed to pattern: {REDIS_PATTERN}")

            async for msg in self.pubsub.listen():
                logger.debug(f"[HUNT-WS] Raw message: {msg}")  # ✅ Debug
                
                if msg["type"] != "pmessage":
                    continue

                # Extract hunt_id from "hunt_ws:123"
                channel = msg["channel"]
                hunt_id = int(channel.split(":", 1)[1])
                
                data = json.loads(msg["data"])
                
                logger.info(f"📨 [HUNT-WS] Received hunt={hunt_id} type={data.get('type')}")
                
                await self.broadcast(hunt_id, data)
                
        except asyncio.CancelledError:
            logger.info("[HUNT-WS] Redis listener cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ [HUNT-WS] Redis loop error: {e}")
            raise

    async def start_redis_listener(self):
        if not self.listener_task:
            logger.info("[HUNT-WS] 🚀 Starting Redis listener...")
            self.listener_task = asyncio.create_task(self._redis_loop())

    async def stop_redis_listener(self):
        if self.listener_task:
            logger.info("[HUNT-WS] 🛑 Stopping Redis listener...")
            self.listener_task.cancel()
            try:
                await self.listener_task
            except asyncio.CancelledError:
                pass
            
            if self.pubsub:
                await self.pubsub.unsubscribe()
            if self.redis_client:
                await self.redis_client.close()
            
            self.listener_task = None


ws_manager = HuntWSManager()