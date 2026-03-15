# backend/app/schemas/threat_hunt.py
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


# -----------------------
# HUNT SESSION
# -----------------------

class HuntScopeCreate(BaseModel):
    name: str = Field(..., example="Suspicious PowerShell Activity")
    description: Optional[str] = None

    dataset_id: int

    time_range_start: datetime
    time_range_end: datetime

    environment: Literal["prod", "dev", "lab"] = "prod"


class HuntSessionResponse(BaseModel):
    hunt_id: int
    status: Literal["created", "running", "completed"] = "created"


# -----------------------
# HYPOTHESIS
# -----------------------

class HypothesisCreate(BaseModel):
    hypothesis: str = Field(
        ..., example="Attacker uses PowerShell for lateral movement"
    )

    techniques: List[str] = Field(
        ..., example=["T1059.001", "T1021"]
    )
    
    rational: str | None = None


# -----------------------
# EXECUTION
# -----------------------

class HuntExecutionCreate(BaseModel):
    mode: Literal["manual", "ai-assisted"] = "ai-assisted"
    depth: Literal["quick", "standard", "deep"] = "standard"

    strategy: Optional[str] = Field(
        None, example="behavioral + anomaly"
    )


# -----------------------
# FINDINGS
# -----------------------

class FindingItem(BaseModel):
    timestamp: datetime
    source: str
    event: str

    severity: Literal["low", "medium", "high", "critical"]
    confidence: int = Field(..., ge=0, le=100)

    mitre_technique: Optional[str] = None
    evidence: Optional[dict] = None


class HuntFindingsResponse(BaseModel):
    hunt_id: int
    items: List[FindingItem]
    summary: dict


# -----------------------
# CONCLUSION
# -----------------------

class HuntConclusionCreate(BaseModel):
    verdict: Literal[
        "confirmed_threat",
        "false_positive",
        "inconclusive"
    ]

    confidence: Literal[
        "low",
        "medium",
        "high"
    ]

    recommendations: Optional[str] = None