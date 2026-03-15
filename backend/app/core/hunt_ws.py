# backend/app/api/core/hunt_ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import json
import logging

from app.core.security import verify_access_token
from app.database.postgres import SessionLocal
from app.services.hunt_service import HuntService
from app.core.hunt_ws_manager import ws_manager

router = APIRouter()
logger = logging.getLogger(__name__)
hunt_service = HuntService()


@router.websocket("/hunts/{hunt_id}")
async def hunt_websocket(
    websocket: WebSocket,
    hunt_id: int,
    token: str = Query(...)
):
    # 1️⃣ Auth
    try:
        payload = verify_access_token(token)
        logger.info(
            f"✅ User {payload.get('sub')} authenticated hunt={hunt_id}"
        )
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    await ws_manager.connect(hunt_id, websocket)

    try:
        # 2️⃣ Initial data
        with SessionLocal() as db:
            data = hunt_service.get_findings(db, hunt_id)
            items = data.get("items", [])

            await websocket.send_json({
                "type": "initial",
                "hunt_id": hunt_id,
                "items": [
                    {
                        "id": f.id,
                        "timestamp": f.timestamp.isoformat() if f.timestamp else None,
                        "source": f.source,
                        "event": f.event,
                        "severity": f.severity,
                        "confidence": f.confidence,
                        "mitre_technique": f.mitre_technique,
                        "evidence": f.evidence,
                    }
                    for f in items
                ],
                "summary": data.get("summary"),
            })

        # 3️⃣ Keep-alive
        while True:
            try:
                msg = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30
                )
                if json.loads(msg).get("type") == "pong":
                    pass

            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})

            except WebSocketDisconnect:
                break

    finally:
        await ws_manager.disconnect(hunt_id, websocket)
        logger.info(f"🧹 WS cleanup hunt={hunt_id}")
