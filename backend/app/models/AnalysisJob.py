# backend/app/models/AnalysisJob.py
from sqlalchemy import Column, Integer, String, DateTime, ARRAY, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.postgres import Base

class Analysis(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True)
    job_name = Column(String(150))
    model_name = Column(String(100), nullable=False)
    time_range_from = Column(DateTime(timezone=True), nullable=True)
    time_range_to = Column(DateTime(timezone=True), nullable=True)
    device_ids = Column(ARRAY(Integer), nullable=True)
    total_logs = Column(Integer, server_default="0")
    detected_threats = Column(Integer, server_default="0")
    status = Column(String(20), server_default="queued")  # queued, running, completed, failed
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))

    creator = relationship("User", back_populates="created_jobs")