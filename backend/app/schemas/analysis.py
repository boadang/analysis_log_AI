# backend/app/schemas/analysis.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AnalysisJobCreate(BaseModel):
    job_name: Optional[str] = None
    model_name: str
    time_range_from: Optional[datetime] = None
    time_range_to: Optional[datetime] = None
    device_ids: Optional[List[int]] = None
    file_path: str

class AnalysisJobResponse(AnalysisJobCreate):
    id: int
    total_logs: int
    detected_threats: int
    status: str
    started_at: datetime
    finished_at: Optional[datetime]
    created_by: int