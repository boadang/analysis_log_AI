# app/models/log_dataset.py

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from datetime import datetime


class LogDataset(Base):
    __tablename__ = "log_datasets"

    id = Column(Integer, primary_key=True)

    # Metadata
    name = Column(String(255), nullable=False)
    description = Column(String)

    source_type = Column(String(50))  # firewall, vpn, ids

    environment = Column(
        Enum("prod", "dev", "lab", name="dataset_env"),
        nullable=False,
        default="prod"
    )
    
    created_by = Column(Integer, nullable = False)

    # File info
    file_path = Column(String(500), nullable=False)
    log_format = Column(String(50))  # raw, csv, json

    # Time coverage
    time_range_start = Column(DateTime)
    time_range_end = Column(DateTime)

    # Traceability
    created_from_job = Column(UUID, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
