# backend/app/core/hunt_ws_manager.py
import asyncio
from typing import Dict, List
from fastapi import WebSocket
import logging
from fastapi import APIRouter

router = APIRouter()
logger = logging.getLogger(__name__)

class HuntWSManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, hunt_id: int, websocket: WebSocket):
        if hunt_id not in self.active_connections:
            self.active_connections[hunt_id] = []
        self.active_connections[hunt_id].append(websocket)
        logger.info(f"✅ Connected to hunt {hunt_id}, total: {len(self.active_connections[hunt_id])}")

    async def disconnect(self, hunt_id: int, websocket: WebSocket):
        if hunt_id in self.active_connections:
            self.active_connections[hunt_id].remove(websocket)
            if not self.active_connections[hunt_id]:
                del self.active_connections[hunt_id]
        logger.info(f"❌ Disconnected from hunt {hunt_id}")

    async def broadcast(self, hunt_id: int, message: dict):
        if hunt_id not in self.active_connections:
            return
        
        dead_connections = []
        for ws in self.active_connections[hunt_id]:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to client: {e}")
                dead_connections.append(ws)
        
        # Clean up dead connections
        for ws in dead_connections:
            await self.disconnect(hunt_id, ws)

ws_manager = HuntWSManager()