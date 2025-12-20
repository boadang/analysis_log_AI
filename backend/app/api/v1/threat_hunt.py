# backend/app/api/v1/threat_hunt.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from typing import List

from app.models.threat_hunt import (
    HuntExecution,
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

router = APIRouter()
hunt_service = HuntService()

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
        exec_obj = hunt_service.create_execution(db, hunt_id, data.dict())
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
def conclude_hunt(hunt_id: int, data: HuntConclusionCreate, db: Session = Depends(get_db)):
    try:
        conclusion = hunt_service.conclude_hunt(db, hunt_id, data.dict(), user_id=1)
        return {"hunt_id": hunt_id, "verdict": conclusion.verdict, "risk_level": conclusion.risk_level, "status": "closed"}
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Hunt not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
