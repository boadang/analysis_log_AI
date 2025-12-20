# backend/app/tasks/analysis_worker.py
from celery import shared_task
from app.database.postgres import SessionLocal
from app.models.analysis_job import AnalysisJob
from app.services.analysis_runner import run_analysis_job
from app.core.ws_manager import job_ws_manager
import traceback

@shared_task(
    name="ai.analysis.run",
    queue="ai",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 15},
)
def run_analysis_task(job_id: int, file_path: str, model_name: str,
                      time_from=None, time_to=None, device_ids=None):
    """
    Celery task để chạy AI phân tích log.
    """
    db = SessionLocal()

    try:
        job = db.get(AnalysisJob, job_id)
        if not job:
            print(f"[TASK] Job {job_id} not found")
            return

        job.status = "running"
        db.commit()
        print(f"[TASK] Job {job_id} running")

        # Chạy AI ko dùng async để tránh vấn đề với Celery
        run_analysis_job(
            job_id=job_id,
            db=db,
            log_file_path=file_path
        )

        print(f"[TASK] Job {job_id} completed")

    except Exception as e:
        print(f"[TASK] Error running job {job_id}: {e}")
        traceback.print_exc()
        if job:
            job.status = "failed"
            db.commit()

    finally:
        db.close()
