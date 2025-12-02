from fastapi import APIRouter
from .auth import router as auth_router
from .analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(analysis_router, prefix="/analysis", tags=["Analysis"])