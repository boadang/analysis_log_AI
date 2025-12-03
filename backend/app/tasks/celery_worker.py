from dotenv import load_dotenv
from app.models import Analysis

# 1) Load biến môi trường trước
load_dotenv()

# 2) Sau đó mới import Celery app
from app.core.celery_app import celery

# 3) Auto-discover tasks
celery.autodiscover_tasks(["app.tasks"])
