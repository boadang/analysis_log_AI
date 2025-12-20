# backend/app/api/v1/hunt_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from app.core.security import verify_access_token
from app.database.postgres import SessionLocal
from app.services.hunt_service import HuntService
import asyncio
import logging
import json

from .hunt_ws_manager import ws_manager

router = APIRouter()
hunt_service = HuntService()
logger = logging.getLogger(__name__)

@router.websocket("/hunts/{hunt_id}")
async def hunt_websocket(
    websocket: WebSocket,
    hunt_id: int,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time hunt updates
    Path: /hunt_ws/hunts/{hunt_id}?token=xxx
    """
    
    # 1️⃣ Xác thực token TRƯỚC
    user_id = None
    try:
        payload = verify_access_token(token)
        user_id = payload.get("sub")
        logger.info(f"✅ User {user_id} authenticated for hunt {hunt_id}")
    except Exception as e:
        logger.error(f"❌ Token verification failed: {str(e)}")
        # Reject connection immediately
        await websocket.close(code=1008, reason="Invalid token")
        return

    # 2️⃣ Accept connection
    try:
        await websocket.accept()
        logger.info(f"🔌 WebSocket accepted for hunt {hunt_id}")
    except Exception as e:
        logger.error(f"❌ Failed to accept WebSocket: {e}")
        return

    # 3️⃣ Register connection
    await ws_manager.connect(hunt_id, websocket)

    try:
        # 4️⃣ Send initial data
        with SessionLocal() as db:
            try:
                findings_data = hunt_service.get_findings(db, hunt_id)
                await websocket.send_json({
                    "type": "initial",
                    "items": findings_data.get("items", []),
                    "summary": findings_data.get("summary"),
                    "hunt_id": hunt_id
                })
                logger.info(f"📤 Sent initial data: {len(findings_data.get('items', []))} findings")
            except Exception as e:
                logger.error(f"❌ Failed to fetch initial data: {e}")
                await websocket.send_json({
                    "type": "initial",
                    "items": [],
                    "summary": None,
                    "hunt_id": hunt_id
                })

        # 5️⃣ Keep-alive loop
        ping_interval = 30
        last_ping = asyncio.get_event_loop().time()
        
        while True:
            try:
                # Check if we need to send ping
                current_time = asyncio.get_event_loop().time()
                if current_time - last_ping >= ping_interval:
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": current_time
                    })
                    last_ping = current_time
                
                # Wait for incoming messages (with timeout)
                try:
                    message = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=1.0
                    )
                    # Handle client messages if needed
                    data = json.loads(message)
                    if data.get("type") == "pong":
                        logger.debug(f"Received pong from client")
                except asyncio.TimeoutError:
                    # No message received, continue loop
                    pass
                
                await asyncio.sleep(0.1)
                
            except WebSocketDisconnect:
                logger.info(f"🔌 Client disconnected normally from hunt {hunt_id}")
                break
            except Exception as e:
                logger.error(f"❌ Error in keep-alive loop: {e}")
                break

    except Exception as e:
        logger.error(f"❌ WebSocket error for hunt {hunt_id}: {e}")
    finally:
        await ws_manager.disconnect(hunt_id, websocket)
        logger.info(f"🧹 Cleaned up connection for hunt {hunt_id}")


# Export manager for use in other modules
def get_ws_manager():
    return ws_manager