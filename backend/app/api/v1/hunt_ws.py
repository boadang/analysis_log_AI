from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import verify_access_token
from app.database.postgres import SessionLocal
from app.services.hunt_service import HuntService
from app.core.hunt_ws_manager import ws_manager
import asyncio
import logging

router = APIRouter()
hunt_service = HuntService()
logger = logging.getLogger(__name__)


@router.websocket("/hunts/{hunt_id}")
async def hunt_websocket(
    websocket: WebSocket,
    hunt_id: int,
    token: str = Query(...),
):
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        logger.info(f"✅ WS auth user={user_id} hunt={hunt_id}")
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    await ws_manager.connect(hunt_id, websocket)

    try:
        # gửi initial findings
        with SessionLocal() as db:
            data = hunt_service.get_findings(db, hunt_id)
            items = []
            for f in data["items"]:
                items.append({
                    "id": f.id,
                    "timestamp": f.timestamp.isoformat() if f.timestamp else None,
                    "source": f.source,
                    "event": f.event,
                    "severity": f.severity,
                    "confidence": f.confidence,
                    "mitre_technique": f.mitre_technique,
                    "evidence": f.evidence,
                })

            await websocket.send_json({
                "type": "initial",
                "hunt_id": hunt_id,
                "items": items,
                "summary": data["summary"],
            })

        # keep alive
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})

    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.disconnect(hunt_id, websocket)
