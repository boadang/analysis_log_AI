# backend/app/api/v1/router.py
from fastapi import APIRouter

from .auth import router as auth_router
from .ai_analysis import router as analysis_http_router
from .ws import router as analysis_ws_router
from .hunt_ws import router as hunt_ws_router
from .chatbot import router as chatbot_router
from .threat_hunt import router as threat_hunt_router
from .home import router as home_router

api_router = APIRouter()

# Auth
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"]
)

# Home
api_router.include_router(
    home_router,
    prefix="/home",
    tags=["Home"]
)

# Threat Hunting
api_router.include_router(
    threat_hunt_router,
    prefix="/threat_hunt",
    tags=["Threat Hunting"]
)

# Threat Hunting - WebSocket (⚠️ KHÔNG auth dependency)
api_router.include_router(
    hunt_ws_router,
    prefix="/hunt_ws",
    tags=["Threat Hunting WS"]
)

# AI Analysis - HTTP
api_router.include_router(
    analysis_http_router,
    prefix="/ai_analysis",
    tags=["AI Analysis"]
)

# AI Analysis - WebSocket (⚠️ KHÔNG auth dependency)
api_router.include_router(
    analysis_ws_router,
    prefix="/ws",
    tags=["AI Analysis WS"]
)

# Chatbot
api_router.include_router(
    chatbot_router, 
    prefix="/chatbot",
    tags=["Chatbot"]
)
