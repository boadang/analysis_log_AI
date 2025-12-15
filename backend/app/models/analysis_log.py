# app/models/analysis_log.py

from sqlalchemy import Column, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database.postgres import Base

class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id"))

    raw_log = Column(Text)
    parsed_result = Column(Text)
    threat_result = Column(Text)

    job = relationship("AnalysisJob", backref="logs")
