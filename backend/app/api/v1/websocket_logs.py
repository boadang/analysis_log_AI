from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio, json

from .generator import generate_log_schema
from .fake_fw_manager import start_stream, stop_stream, is_running

router = APIRouter()

@router.websocket("/ws/logs/{fw_id}")
async def websocket_logs(ws: WebSocket, fw_id: str):
    await ws.accept()
    print(f"Client connected FW: {fw_id}")

    # get speed in logs per second
    speed = int(ws.query_params.get("speed", 5))
    interval = 1 / speed

    start_stream(fw_id)

    try:
        while is_running(fw_id):
            log = generate_log_schema(fw_id)
            await ws.send_text(json.dumps(log, default=str))
            await asyncio.sleep(interval)

    except WebSocketDisconnect:
        print(f"Client disconnected FW: {fw_id}")
        stop_stream(fw_id)
