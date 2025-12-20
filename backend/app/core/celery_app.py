# backend/app/core/celery_app.py
from celery import Celery
from dotenv import load_dotenv

from .config import settings
import os

load_dotenv()

celery_app = Celery(
    "soc_platform",
    broker=settings.CELERY_BROKER_URL,          # không thêm /0 nữa
    backend=settings.CELERY_RESULT_BACKEND,     # không thêm /1 nữa
)

# 🔍 Auto-discover tất cả tasks
celery_app.autodiscover_tasks([
    "app.tasks",
])

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

