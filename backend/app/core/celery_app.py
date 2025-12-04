# backend/app/core/celery_app.py
from celery import Celery
from dotenv import load_dotenv
import os

load_dotenv()

from app.core.config import settings

celery = Celery(
    "backend",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery.conf.update(
    task_track_started=True,
    task_serializer="json",
    accept_content=["json"],
)

# Auto-discover tasks trong app.tasks
celery.autodiscover_tasks(["app.tasks"])
