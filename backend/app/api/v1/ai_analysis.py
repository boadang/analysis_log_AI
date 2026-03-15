# backend/app/api/v1/ai_analysis.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.schemas.analysis import AnalysisJobCreate, AnalysisJobOut
from app.services.analysis_service import AnalysisService
from app.schemas.analysis import LogOut
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.models.analysis_job import AnalysisJob
from app.models.analysis_log import AnalysisLog
import uuid, os

router = APIRouter()
service = AnalysisService()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploaded_logs")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/run-analysis", response_model=AnalysisJobOut)
def run_analysis(
    job_data: AnalysisJobCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    job = service.create_job(
        db,
        job_name=job_data.job_name,
        model_name=job_data.model_name,
        file_path=job_data.file_path or job_data.uploaded_file_path,
        time_from=job_data.time_range_from,
        time_to=job_data.time_range_to,
        device_ids=job_data.device_ids,
        created_by=current_user.id
    )
    service.enqueue_job(job, queue="ai")
    return job

@router.post("/upload")
async def upload_log(file: UploadFile = File(...)):
    try:
        filename = f"{uuid.uuid4()}_{file.filename}"
        path = os.path.join(UPLOAD_DIR, filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(await file.read())
        return {"filepath": path, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
