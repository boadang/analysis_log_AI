from celery import Celery
from app.core.config import settings  # settings chứa CELERY_BROKER_URL, CELERY_RESULT_BACKEND

celery = Celery(
    "backend",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery.autodiscover_tasks(["app.tasks"])
