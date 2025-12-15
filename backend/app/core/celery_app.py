# backend/app/core/celery_app.py
from celery import Celery
from dotenv import load_dotenv
import os
from app.core.config import settings
from celery import Celery

load_dotenv()

celery_app = Celery(
    "analysis_worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

# QUAN TRỌNG: discover tasks
celery_app.autodiscover_tasks([
    "app.tasks",
])

celery_app.conf.update(
    task_routes={
        "tasks.analysis_worker.run_analysis_task": {"queue": "celery"},
    },
    task_track_started=True,
)


