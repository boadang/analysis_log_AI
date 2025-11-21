# backend/app/schemas/alert.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class AlertCreate(BaseModel):
    device_id: Optional[int]
    log_mongo_id: str
    severity: str
    attack_type: Optional[str]
    title: str
    description: Optional[str] = None
    ai_confidence: Optional[float] = None

class AlertResponse(AlertCreate):
    id: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]