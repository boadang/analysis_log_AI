from datetime import datetime
from typing import List
from pydantic import BaseModel

class LogModel(BaseModel):
    analysis_job_id: int
    timestamp: datetime
    received_at: datetime

    source_ip: str
    source_port: int
    dest_ip: str
    dest_port: int
    protocol: str
    action: str

    rule_id: str

    threat_type: str
    ai_confidence: float
    ai_labels: List[str]

    raw_log: str
    analyzed: bool
    