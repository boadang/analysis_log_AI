from typing import Dict, Set
from fastapi import WebSocket
from fastapi.websockets import WebSocketState
import redis.asyncio as redis
import asyncio
import json

REDIS_URL = "redis://localhost:6379/0"
CHANNEL_PATTERN = "job:*"


class JobWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_client: redis.Redis | None = None
        self.pubsub = None
        self.listener_task: asyncio.Task | None = None

    # =====================================================
    # WebSocket lifecycle
    # =====================================================

    async def connect(self, job_id: str, websocket: WebSocket):
        job_id = str(job_id)

        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()

        self.active_connections[job_id].add(websocket)

        print(f"[WS] Connected job={job_id}")

        print(
            f"[WS] ✅ Connected job={job_id} "
            f"clients={len(self.active_connections[job_id])}"
        )

    def disconnect(self, job_id: str, websocket: WebSocket):
        job_id = str(job_id)
        conns = self.active_connections.get(job_id)

        if not conns:
            return

        conns.discard(websocket)

        if not conns:
            self.active_connections.pop(job_id, None)

        print(f"[WS] ❌ Disconnected job={job_id}")

    # =====================================================
    # Send / Broadcast
    # =====================================================

    async def broadcast(self, job_id: str, message: dict):
        job_id = str(job_id)
        connections = self.active_connections.get(job_id, set())

        if not connections:
            print(f"[WS] ⚠️ No active clients for job={job_id}")
            return

        alive: Set[WebSocket] = set()

        for ws in connections:
            try:
                if ws.application_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
                    alive.add(ws)
                else:
                    print("[WS] ⚠️ Socket not connected, drop")
            except Exception as e:
                print(f"[WS] ❌ Send error: {e}")

        self.active_connections[job_id] = alive

        print(
            f"[WS] 📤 Broadcast job={job_id} "
            f"type={message.get('type')} "
            f"alive={len(alive)}"
        )

    # =====================================================
    # Redis Pub/Sub
    # =====================================================

    async def start_redis_listener(self):
        if self.listener_task:
            return  # already running

        self.listener_task = asyncio.create_task(self._redis_loop())

    async def _redis_loop(self):
        try:
            self.redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True
            )

            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.psubscribe(CHANNEL_PATTERN)

            print(f"[WS-PUB] ✅ Subscribed Redis {CHANNEL_PATTERN}")

            async for message in self.pubsub.listen():
                if message["type"] != "pmessage":
                    continue

                try:
                    channel = message["channel"]
                    job_id = channel.split(":", 1)[1]
                    payload = json.loads(message["data"])

                    print(
                        f"[WS-PUB] 📨 Redis → WS "
                        f"job={job_id} type={payload.get('type')}"
                    )

                    await self.broadcast(job_id, payload)

                except Exception as e:
                    print(f"[WS-PUB] ❌ Parse/Broadcast error: {e}")

        except Exception as e:
            print(f"[WS-PUB] ❌ Redis listener crash: {e}")

    async def stop_redis_listener(self):
        try:
            if self.pubsub:
                await self.pubsub.unsubscribe()
                await self.pubsub.close()

            if self.redis_client:
                await self.redis_client.close()

        except Exception:
            pass

        print("[WS-PUB] 🛑 Redis listener stopped")


job_ws_manager = JobWebSocketManager()
