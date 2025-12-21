# app/models/analysis_log.py

from sqlalchemy import Column, Text, ForeignKey, Integer, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id = Column(
        UUID(as_uuid=True),  # vẫn giữ as_uuid=True để SQLAlchemy trả về object UUID khi query
        primary_key=True,
        server_default=text("gen_random_uuid()"),  # ← Quan trọng: để DB tự gen
    )

    job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id"), nullable=True)

    raw_log = Column(Text)
    parsed_result = Column(Text)
    threat_result = Column(Text)
    dataset_id = Column(
        Integer,
        ForeignKey("log_datasets.id"),
        nullable=False
    )

    job = relationship("AnalysisJob", backref="logs")
