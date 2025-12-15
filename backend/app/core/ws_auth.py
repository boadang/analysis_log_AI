# backend/app/core/ws_auth.py
from fastapi import WebSocket, status
from jose import jwt, JWTError
from app.core.config import settings

async def get_user_from_ws(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload.get("sub")  # user_id
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
