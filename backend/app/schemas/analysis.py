from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from typing import Dict, Any

class AnalysisJobCreate(BaseModel):
    job_name: Optional[str]
    model_name: str
    uploaded_file_path: Optional[str] = None
    file_path: Optional[str] = None
    time_range_from: Optional[datetime] = None
    time_range_to: Optional[datetime] = None
    device_ids: Optional[List[int]] = None

class AnalysisJobOut(BaseModel):
    id: UUID
    job_name: str
    model_name: str
    status: str

    created_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]

    created_by: int  # user id

    time_range_from: Optional[datetime] = None
    time_range_to: Optional[datetime] = None

    device_ids: Optional[List[int]] = None

    file_path: Optional[str] = None
    uploaded_file_path: Optional[str] = None

    total_logs: int = 0
    detected_threats: int = 0

    summary: Optional[Dict[str, Any]] = None
    timeline: Optional[List[Dict[str, Any]]] = None

    analysis_text: Optional[str] = None

    model_config = {
        "from_attributes": True  # Pydantic v2 (thay cho orm_mode)
    }

class LogOut(BaseModel):
    id: int
    raw_log: str
    parsed_result: str
    threat_result: str

    class Config:
        orm_mode = True
