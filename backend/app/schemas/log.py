# backend/app/schemas/log.py  ← Schema cho MongoDB document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class FirewallLogBase(BaseModel):
    device_id: Optional[int] = None
    timestamp: datetime
    received_at: Optional[datetime] = None
    source_ip: str
    source_port: Optional[int] = None
    dest_ip: str
    dest_port: Optional[int] = None
    protocol: Optional[str] = None
    action: str
    rule_id: Optional[str] = None
    raw_log: str

class FirewallLogAnalyzed(FirewallLogBase):
    threat_type: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_labels: Optional[List[str]] = None
    analyzed: bool = True
    analysis_job_id: Optional[int] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}