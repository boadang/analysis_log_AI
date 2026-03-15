from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.dependencies import get_db, get_current_user
from app.models.analysis_log import AnalysisLog
from app.models.analysis_job import AnalysisJob
from app.models.log_dataset import LogDataset
from app.services.log_parser import logParser
from app.models.user import User

router = APIRouter()

@router.get("/get-data")
def get_home_data(
    db: Session = Depends(get_db),
    user:User = Depends(get_current_user)
):
    # ====== STATS ======
    total_logs = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.created_by == user.id).scalar() or 0

    total_detected_threats = db.query(
        func.sum(AnalysisJob.detected_threats)
            .filter(AnalysisJob.created_by == user.id)
    ).scalar() or 0

    total_datasets = db.query(func.count(LogDataset.id)).filter(AnalysisLog.created_by == user.id).scalar() or 0

    # ====== RECENT LOGS (từ analysis_jobs) ======
    jobs = (
        db.query(AnalysisLog)
        .filter(AnalysisLog.created_by == user.id)
        .order_by(AnalysisLog.created_at.desc())
        .limit(5)
        .all()
    )

    recent_logs = []
    for job in jobs:
        parsed = logParser.parse_raw_log(job.raw_log)

        recent_logs.append({
            "time": parsed.get("time"),
            "src": parsed.get("src"),
            "action": parsed.get("action"),
            "threat": parsed.get("threat"),
            "ai": 90  # mock
        })

    return {
        "stats": {
            "total_logs": total_logs,
            "detected_threats": total_detected_threats,
            "datasets": total_datasets,
            "ai_score": 95  # mock
        },
        "recent_logs": recent_logs
    }
