from app.core.celery_app import celery

# Auto-discover tasks trong thư mục tasks/
celery.autodiscover_tasks(["app.tasks"])
