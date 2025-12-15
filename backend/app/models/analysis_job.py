# app/models/analysis_job.py

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY, UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.postgres import Base
from datetime import datetime
import uuid

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"
    __table_args__ = {"extend_existing": True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_name = Column(String, default="UNKNOWN Analysis")
    model_name = Column(String)

    time_range_from = Column(DateTime)
    time_range_to = Column(DateTime)

    device_ids = Column(ARRAY(Integer))

    file_path = Column(String(500))
    uploaded_file_path = Column(String(500))

    status = Column(String, default="queued")

    started_at = Column(DateTime)
    finished_at = Column(DateTime)

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    total_logs = Column(Integer, default=0)
    detected_threats = Column(Integer, default=0)

    summary = Column(JSONB, nullable=True)
    timeline = Column(JSONB, nullable=True)
    analysis_text = Column(Text, nullable=True)

    creator = relationship("User", back_populates="created_jobs")
