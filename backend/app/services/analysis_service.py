# backend/app/services/analysis_service.py
from pathlib import Path
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.analysis_job import AnalysisJob
from app.models.analysis_log import AnalysisLog
from app.core.celery_app import celery_app
from app.tasks.analysis_worker import run_analysis_task
from app.core.ws_manager import job_ws_manager 

class AnalysisService:
    """
    SOC-style service for AI log analysis
    Handles:
    - Job creation
    - Celery enqueue
    - Status updates
    - Realtime WS broadcasting
    """

    def create_job(
        self,
        db: Session,
        job_name: str,
        model_name: str,
        file_path: str,
        time_from: Optional[datetime],
        time_to: Optional[datetime],
        device_ids: Optional[list],
        created_by: int
    ) -> AnalysisJob:

        abs_path = str(Path(file_path).resolve())

        job = AnalysisJob(
            job_name=job_name or f"UNKNOWN Analysis {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}",
            model_name=model_name,
            file_path=abs_path,
            time_range_from=time_from,
            time_range_to=time_to,
            device_ids=device_ids,
            status="queued",
            created_by=created_by,
        )
        
        print("Job Details: ", job)

        db.add(job)
        db.commit()
        db.refresh(job)

        # Broadcast to FE that a new job is created
        job_ws_manager.broadcast_job_status(job.id, "queued")

        return job

    def enqueue_job(
        self,
        job: AnalysisJob,
        queue: str = "ai"
    ):
        """
        Enqueue job to Celery worker
        """
        run_analysis_task.apply_async(
            args=[
                job.id,
                job.file_path,
                job.model_name,
                job.time_range_from,
                job.time_range_to,
                job.device_ids
            ],
            queue=queue
        )

    def update_status(self, db: Session, job_id: int, status: str):
        job = db.get(AnalysisJob, job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        job.status = status
        db.commit()
        db.refresh(job)

        # Push WS
        job_ws_manager.broadcast_job_status(job.id, status)

    def save_log(self, db: Session, job_id: int, log_line: str):
        log = AnalysisLog(job_id=job_id, content=log_line)
        db.add(log)
        db.commit()
        db.refresh(log)

        # Push realtime WS
        job_ws_manager.broadcast_job_log(job_id, log_line)
        return log
