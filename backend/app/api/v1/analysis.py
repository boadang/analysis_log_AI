# backend/app/api/v1/analysis.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.services.analysis_service import start_analysis
from app.dependencies import get_current_user
from app.core.celery_app import celery
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.AnalysisJob import Analysis
from app.schemas.analysis import AnalysisJobCreate
import os
import uuid

router = APIRouter()
UPLOAD_DIR = "uploads/logs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = ["log", "txt", "csv"]


# =========================================================
# 1. RUN ANALYSIS
# =========================================================
@router.post("/run-analysis")
async def run_analysis(
    data: AnalysisJobCreate,
    current_user_id: int = 1
):

    print("\n[API] /run-analysis called")
    print("[API] Received data:", data)

    # Kiểm tra file có tồn tại không
    if not os.path.exists(data.file_path):
        raise HTTPException(status_code=400, detail="Uploaded log file not found")

    print("[API] File OK:", data.file_path)

    # --- GỌI SERVICE ĐỂ TẠO JOB + GỬI CELERY ---
    try:
        analysis = await start_analysis(
            data,
            current_user_id
        )
        print("[API] Task queued OK")

    except Exception as e:
        print("[API] Celery ERROR:", e)
        raise HTTPException(status_code=500, detail="Failed to enqueue Celery task")

    return {
        "message": "Job created & queued",
        "analysis_id": analysis.id,
        "status": analysis.status
    }



# =========================================================
# 2. UPLOAD FILE
# =========================================================
@router.post("/upload")
async def upload_log_file(file: UploadFile = File(...)):

    print("\n[API] /upload called")
    print("[API] Uploaded filename:", file.filename)

    ext = file.filename.split(".")[-1].lower()
    print("[API] File extension:", ext)

    if ext not in ALLOWED_EXTENSIONS:
        print("[API] ERROR — unsupported extension:", ext)
        raise HTTPException(status_code=400, detail="Unsupported file extension")

    content = await file.read()
    print("[API] File size:", len(content))

    if len(content) > MAX_FILE_SIZE:
        print("[API] ERROR — file too large")
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")

    # Tạo tên file duy nhất
    file_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(content)

    print("[API] File saved:", file_path)

    return {
        "message": "uploaded",
        "file_path": file_path,
        "file_name": file.filename
    }


# =========================================================
# 3. GET JOB LIST
# =========================================================
@router.get("/jobs")
def list_jobs(limit: int = 10, db: Session = Depends(get_db)):
    print(f"\n[API] /jobs called — limit={limit}")

    jobs = db.query(Analysis).order_by(Analysis.started_at.desc()).limit(limit).all()

    print("[API] Jobs returned:", len(jobs))

    return jobs
