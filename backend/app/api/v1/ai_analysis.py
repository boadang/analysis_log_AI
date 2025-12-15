# backend/app/api/v1/ai_analysis.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from datetime import datetime
from app.models.analysis_job import AnalysisJob
from app.models.analysis_log import AnalysisLog
from app.schemas.analysis import AnalysisJobCreate, AnalysisJobOut, LogOut
from app.tasks.analysis_worker import run_analysis_task
import uuid
from uuid import UUID
import os
from typing import List

router = APIRouter()

# -------------------------
# Folder upload (absolute path)
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # folder chứa file ai_analysis.py
UPLOAD_DIR = os.path.join(BASE_DIR, "uploaded_logs")
os.makedirs(UPLOAD_DIR, exist_ok=True)  # tạo folder nếu chưa tồn tại

# -------------------------
# Create Job
# -------------------------
@router.post("/run-analysis", response_model=AnalysisJobOut)
def run_analysis(
    job_data: AnalysisJobCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),  # lấy user hiện tại
):
    db_job = AnalysisJob(
        job_name=job_data.job_name or f"UNKNOWN Analysis {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}",
        model_name=job_data.model_name,
        uploaded_file_path=job_data.uploaded_file_path,
        file_path=job_data.file_path,
        time_range_from=job_data.time_range_from,
        time_range_to=job_data.time_range_to,
        device_ids=job_data.device_ids,
        status="queued",
        created_by=current_user.id,  # hoặc email/username tuỳ cách bạn lưu
    )
    
    print("[AI-ANALYSIS] Creating job:", db_job)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    run_analysis_task.delay(
        db_job.id,
        db_job.file_path,
        db_job.model_name,
        db_job.time_range_from,
        db_job.time_range_to,
        db_job.device_ids
    )  # trigger Celery task
    return db_job

# -------------------------
# Upload log file
# -------------------------
@router.post("/upload")
async def upload_log(file: UploadFile = File(...)):
    try:
        # tạo tên file duy nhất
        filename = f"{uuid.uuid4()}_{file.filename}"
        path = os.path.join(UPLOAD_DIR, filename)

        # đảm bảo folder tồn tại
        os.makedirs(os.path.dirname(path), exist_ok=True)

        # ghi file
        with open(path, "wb") as f:
            f.write(await file.read())

        return {"filepath": path, "filename": file.filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

# -------------------------
# List jobs
# -------------------------
@router.get("/jobs", response_model=List[AnalysisJobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    jobs = db.query(AnalysisJob).filter(AnalysisJob.created_by == current_user.id)\
        .order_by(AnalysisJob.created_at.desc()).all()
    return jobs

# -------------------------
# Get job detail
# -------------------------
@router.get("/jobs/{job_id}", response_model=AnalysisJobOut)
def get_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    job = db.query(AnalysisJob).filter(
        AnalysisJob.id == job_id,
        AnalysisJob.created_by == current_user.id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

# -------------------------
# Get job logs
# -------------------------
@router.get("/jobs/{job_id}/logs", response_model=List[LogOut])
def get_logs(job_id: UUID, db: Session = Depends(get_db)):
    logs = db.query(AnalysisLog).filter(AnalysisLog.job_id == job_id).all()
    return logs
