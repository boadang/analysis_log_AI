# backend/app/api/v1/threat_hunt.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi import UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import NoResultFound
from typing import List, Dict, Any, Optional
import logging

from app.models.threat_hunt import (
    HuntSession,
    HuntHypothesis,
    HuntExecution,
    HuntFinding,
    HuntConclusion
)
from app.schemas.threat_hunt import (
    HuntScopeCreate, HuntSessionResponse,
    HypothesisCreate, HuntExecutionCreate,
    HuntFindingsResponse, HuntConclusionCreate
)
from app.services.hunt_service import HuntService
from app.dependencies import get_db, get_current_user
from app.core.log_sources import LOG_SOURCE_CATALOG
from datetime import datetime

from app.models.user import User

router = APIRouter()
hunt_service = HuntService()

logger = logging.getLogger(__name__)

@router.get("/log_datasets")
def list_log_datasets(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Lấy danh sách tất cả log datasets có sẵn để chọn khi tạo hunt
    """
    datasets = hunt_service.get_dataset_logs(db)
    # Trả về dạng list dict đơn giản, hoặc bạn có thể tạo schema riêng nếu cần
    return [
        {
            "id": ds.id,
            "name": ds.name,
            "description": ds.description,
            "source_type": ds.source_type,
            # thêm các field khác nếu cần
        }
        for ds in datasets
    ]
# ---------------------------
# 3. Get log by hunt_id
# ---------------------------
@router.get("/logs/{hunt_id}")
def get_logs(hunt_id: int, db: Session = Depends(get_db)):
    try:
        logs = hunt_service.get_analysis_logs(db, hunt_id)
        return {"id": hunt_id, "lines": logs}
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Hunt not found")

# ---------------------------
# 4. Create hunt session
# ---------------------------
@router.post("/sessions", response_model=HuntSessionResponse, status_code=201)
def create_hunt_session(scope: HuntScopeCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    try:
        hunt = hunt_service.create_hunt(
            db=db,
            scope=scope,
            user_id=user.id
        )
        return {"hunt_id": hunt.id, "status": hunt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------------------------
# 5. Save hypothesis
# ---------------------------
@router.post("/{hunt_id}/hypothesis")
def save_hypothesis(
        hunt_id: int, 
        data: HypothesisCreate, 
        db: Session = Depends(get_db), 
        current_user = Depends(get_current_user)
    ):
    try:
        print("Current user ID", current_user.id)
        hypo = hunt_service.save_hypothesis(db, hunt_id, data.dict(), user_id=current_user.id)
        return {
            "hunt_id": hunt_id, 
            "status": "saved",
            "techniques": hypo.techniques
        }
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Hunt not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------------------------
# 6. Execute hunt
# ---------------------------
@router.post("/{hunt_id}/execute")
def execute_hunt(hunt_id: int, data: HuntExecutionCreate, db: Session = Depends(get_db)):
    try: 
        print(HuntExecution.__table__.columns.keys())
        exec_obj = hunt_service.create_execution(db, hunt_id, data.model_dump())
        return {"hunt_id": hunt_id, "execution_id": exec_obj.id, "status": exec_obj.status}
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Hunt not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.post("/{hunt_id}/executions/{execution_id}/pause")
def pause_execution(
    hunt_id: int,
    execution_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        execution = hunt_service.pause_execution(db, hunt_id, execution_id)
        return {"execution_id": execution.id, "status": execution.status}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{hunt_id}/executions/{execution_id}/stop")
def stop_execution(
    hunt_id: int,
    execution_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        execution = hunt_service.stop_execution(db, hunt_id, execution_id)
        return {"execution_id": execution.id, "status": execution.status}
    except ValueError:
        raise HTTPException(status_code=404, detail="Execution not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# 7. Get findings
# ---------------------------
@router.get("/{hunt_id}/findings", response_model=HuntFindingsResponse)
def get_findings(hunt_id: int, db: Session = Depends(get_db)):
    try:
        return hunt_service.get_findings(db, hunt_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Hunt not found")

# ---------------------------
# 8. Conclude hunt
# ---------------------------
@router.post("/{hunt_id}/conclusion")
def conclude_hunt(hunt_id: int, data: HuntConclusionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        logger.warning("=== CONCLUDE HUNT REQUEST ===")
        logger.warning(f"Hunt ID: {hunt_id}")
        logger.warning(f"Raw body: {data}")
        logger.warning(f"DB: {db}")

        conclusion = hunt_service.conclude_hunt(
            db,
            hunt_id,
            data.dict(),
            user_id=current_user.id,
        )

        return {
            "hunt_id": hunt_id,
            "verdict": conclusion.verdict,
            "risk_level": conclusion.risk_level,
            "status": "closed",
        }

    except Exception as e:
        logger.exception("❌ CONCLUDE HUNT FAILED")
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/hunts")
def get_all_hunts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """
    Lấy danh sách tất cả hunt sessions với đầy đủ thông tin
    """
    # Query với joinedload để eager load relationships
    query = (
        db.query(HuntSession)
        .options(
            joinedload(HuntSession.hypothesis),
            joinedload(HuntSession.executions),
            joinedload(HuntSession.findings),
            joinedload(HuntSession.conclusion)
        )
        .filter(HuntSession.created_by == current_user.id)
    )
    
    if status:
        query = query.filter(HuntSession.status == status)
    
    total = query.count()
    items = query.order_by(HuntSession.id.desc()).offset(offset).limit(limit).all()
    
    return {
        "items": [serialize_hunt_session(h) for h in items],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/hunts/{hunt_id}/detail")
def get_hunt_detail(
    hunt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết đầy đủ của 1 hunt session
    """
    hunt = (
        db.query(HuntSession)
        .options(
            joinedload(HuntSession.hypothesis),
            joinedload(HuntSession.executions),
            joinedload(HuntSession.findings),
            joinedload(HuntSession.conclusion)
        )
        .filter(
            HuntSession.id == hunt_id,
            HuntSession.created_by == current_user.id
        )
        .first()
    )
    
    if not hunt:
        raise HTTPException(status_code=404, detail="Hunt not found")
    
    return serialize_hunt_session(hunt)


def serialize_hunt_session(hunt: HuntSession) -> dict:
    """
    Serialize HuntSession với tất cả relationships
    """
    # Latest execution
    latest_execution = None
    if hunt.executions:
        latest_execution = max(hunt.executions, key=lambda e: e.id)
    
    # Findings summary
    findings_count = len(hunt.findings)
    findings_by_severity = {
        "critical": len([f for f in hunt.findings if f.severity == "critical"]),
        "high": len([f for f in hunt.findings if f.severity == "high"]),
        "medium": len([f for f in hunt.findings if f.severity == "medium"]),
        "low": len([f for f in hunt.findings if f.severity == "low"]),
    }
    
    return {
        "id": hunt.id,
        "name": hunt.name,
        "description": hunt.description,
        "environment": hunt.environment,
        "time_range_start": hunt.time_range_start.isoformat() if hunt.time_range_start else None,
        "time_range_end": hunt.time_range_end.isoformat() if hunt.time_range_end else None,
        "status": hunt.status,
        "created_by": hunt.created_by,
        "dataset_id": hunt.dataset_id,
        
        # Hypothesis
        "hypothesis": {
            "id": hunt.hypothesis.id,
            "hypothesis": hunt.hypothesis.hypothesis,
            "techniques": hunt.hypothesis.techniques,
            "created_by": hunt.hypothesis.created_by,
        } if hunt.hypothesis else None,
        
        # Latest Execution
        "latest_execution": {
            "id": latest_execution.id,
            "mode": latest_execution.mode,
            "depth": latest_execution.depth,
            "strategy": latest_execution.strategy,
            "status": latest_execution.status,
            "started_at": latest_execution.started_at.isoformat() if latest_execution.started_at else None,
            "finished_at": latest_execution.finished_at.isoformat() if latest_execution.finished_at else None,
            "error": latest_execution.error,
        } if latest_execution else None,
        
        # Findings Summary
        "findings_summary": {
            "total": findings_count,
            "by_severity": findings_by_severity,
        },
        
        # Conclusion
        "conclusion": {
            "id": hunt.conclusion.id,
            "verdict": hunt.conclusion.verdict,
            "risk_level": hunt.conclusion.risk_level,
            "recommendation": hunt.conclusion.recommendation,
            "closed_by": hunt.conclusion.closed_by,
            "closed_at": hunt.conclusion.closed_at.isoformat() if hunt.conclusion.closed_at else None,
        } if hunt.conclusion else None,
    }
