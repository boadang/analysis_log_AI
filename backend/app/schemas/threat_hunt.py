from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


# -----------------------
# HUNT SESSION
# -----------------------

class HuntScopeCreate(BaseModel):
    name: str = Field(..., example="Suspicious PowerShell Activity")
    description: Optional[str] = None

    data_sources: List[str] = Field(
        ..., example=["windows_event", "firewall", "proxy"]
    )

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
        "true_positive",
        "false_positive",
        "inconclusive"
    ]

    risk_level: Literal["low", "medium", "high", "critical"]
    recommendation: Optional[str] = None
