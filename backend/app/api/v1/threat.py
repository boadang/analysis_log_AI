# backend/app/api/threat_router.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from typing import List
import traceback
from app.database.postgres import SessionLocal
from app.models.analysis_job import AnalysisJob as Analysis
from app.services.threat_service import read_log_file_to_lines, hunt_threats_from_lines
from app.dependencies import get_current_user
import os, shutil
from datetime import datetime, timezone
from app.schemas.threat import HuntRequest, LogSourceOut

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "storage/uploads")
model_ai_default = "qwen3:8b"


# -------------------------------------------------------
# GET /log-sources — Lấy danh sách file log user đã upload
# -------------------------------------------------------
@router.get("/log-sources", response_model=List[LogSourceOut])
def get_log_sources(user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        items = (
            db.query(Analysis)
            .filter(Analysis.created_by == user.id)
            .order_by(Analysis.started_at.desc())
            .limit(100)
            .all()
        )

        return [
            LogSourceOut(
                id=a.id,
                file_name=a.job_name,
                uploaded_at=a.started_at.isoformat()
            ) for a in items
        ]

    finally:
        db.close()

# -------------------------------------------------------
# GET /load-log/{id} — Đọc lại file log từ DB
# -------------------------------------------------------
@router.get("/load-log/{analysis_id}")
def load_log(analysis_id: int, user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        a = (
            db.query(Analysis)
            .filter(Analysis.id == analysis_id, Analysis.created_by == user.id)
            .first()
        )

        if not a:
            raise HTTPException(status_code=404, detail="Analysis not found or not owned by user")

        if not a.file_path or not os.path.exists(a.file_path):
            raise HTTPException(status_code=404, detail="Log file not found on disk")

        lines = read_log_file_to_lines(a.file_path)
        return {"file_name": a.job_name, "lines": lines}

    finally:
        db.close()


# -------------------------------------------------------
# POST /upload-log — Upload file mới
# -------------------------------------------------------
@router.post("/upload-log")
def upload_log(file: UploadFile = File(...), user=Depends(get_current_user)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    print("[THREAT_ROUTER] user received:", user)
    # đặt tên file an toàn, unique
    filename = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    dest = os.path.join(UPLOAD_DIR, filename)

    with open(dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db = SessionLocal()
    try:
        new = Analysis(
            job_name=f"Upload {file.filename}",
            model_name=model_ai_default,       # có thể cho user chọn ở FE nếu muốn
            time_range_from=None,
            time_range_to=None,
            device_ids=[],
            total_logs=0,
            detected_threats=0,
            status="queued",
            finished_at=None,
            created_by=user.id,
            file_path=dest,
            started_at=datetime.now(timezone.utc)
        )

        db.add(new)
        db.commit()
        db.refresh(new)

        return {
            "id": new.id,
            "file_name": new.job_name,
            "status": new.status,
            "model": new.model_name
        }

    except Exception as e:
        print("UPLOAD-LOG ERROR:", e)
        print(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


# -------------------------------------------------------
# POST /hunt — Thực thi threat hunting
# -------------------------------------------------------
@router.post("/hunt")
def post_hunt(body: HuntRequest = Body(...), user=Depends(get_current_user)):
    # Không còn xử lý logs gửi từ frontend
    # Chỉ xử lý analysis_id → load logs từ DB

    db = SessionLocal()
    try:
        a = (
            db.query(Analysis)
            .filter(Analysis.id == body.analysis_id, Analysis.created_by == user.id)
            .first()
        )

        if not a:
            raise HTTPException(status_code=404, detail="Analysis not found or not owned by user")

        if not os.path.exists(a.file_path):
            raise HTTPException(status_code=404, detail="Log file not found")

        # Load file log
        lines = read_log_file_to_lines(a.file_path)

    finally:
        db.close()

    # Gọi AI service
    try:
        results = hunt_threats_from_lines(
            lines=lines,
            model=model_ai_default,
            user_query=body.query
        )
        return {"items": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

