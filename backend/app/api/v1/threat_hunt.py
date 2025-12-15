from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.threat_hunt import (
    HuntScopeCreate,
    HuntSessionResponse,
    HypothesisCreate,
    HuntExecutionCreate,
    HuntFindingsResponse,
    HuntConclusionCreate,
)

# from app.database import get_db
# from app.services.hunt_engine import HuntEngine

router = APIRouter()


# -----------------------
# CREATE SESSION
# -----------------------

@router.post("/sessions", response_model=HuntSessionResponse)
def create_hunt_session(
    scope: HuntScopeCreate,
    # db: Session = Depends(get_db)
):
    # TODO: save DB
    hunt_id = 1

    return {
        "hunt_id": hunt_id,
        "status": "created"
    }


# -----------------------
# SAVE HYPOTHESIS
# -----------------------

@router.post("/{hunt_id}/hypothesis")
def save_hypothesis(
    hunt_id: int,
    data: HypothesisCreate,
    # db: Session = Depends(get_db)
):
    # TODO: validate hunt_id
    return {
        "hunt_id": hunt_id,
        "hypothesis": data.hypothesis,
        "techniques": data.techniques,
        "status": "saved"
    }


# -----------------------
# EXECUTE HUNT
# -----------------------

@router.post("/{hunt_id}/execute")
def execute_hunt(
    hunt_id: int,
    data: HuntExecutionCreate,
    # db: Session = Depends(get_db)
):
    # TODO:
    # - mark hunt running
    # - enqueue AI / Celery
    return {
        "hunt_id": hunt_id,
        "status": "running",
        "mode": data.mode,
        "depth": data.depth,
    }


# -----------------------
# GET FINDINGS
# -----------------------

@router.get("/{hunt_id}/findings", response_model=HuntFindingsResponse)
def get_findings(
    hunt_id: int,
    # db: Session = Depends(get_db)
):
    findings = [
        {
            "timestamp": "2025-01-01T10:00:00",
            "source": "windows_event",
            "event": "PowerShell suspicious encoded command",
            "severity": "high",
            "confidence": 92,
            "mitre_technique": "T1059.001",
            "evidence": {"command": "powershell -enc ..."}
        }
    ]

    return {
        "hunt_id": hunt_id,
        "items": findings,
        "summary": {
            "total": len(findings),
            "high": 1,
            "critical": 0
        }
    }


# -----------------------
# CONCLUSION
# -----------------------

@router.post("/{hunt_id}/conclusion")
def save_conclusion(
    hunt_id: int,
    data: HuntConclusionCreate,
    # db: Session = Depends(get_db)
):
    return {
        "hunt_id": hunt_id,
        "verdict": data.verdict,
        "risk_level": data.risk_level,
        "status": "closed"
    }
