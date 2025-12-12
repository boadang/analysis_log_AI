from fastapi import APIRouter
from .auth import router as auth_router
from .analysis import router as analysis_router
from .threat import router as threat_router
from .chatbot import router as chatbot_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(analysis_router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(threat_router, prefix="/threat", tags=["ThreatHunting"])
api_router.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])