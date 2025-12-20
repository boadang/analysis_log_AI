# backend/app/models/alert.py
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, func
from .base import Base
from sqlalchemy.orm import relationship

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    log_mongo_id = Column(String(24), nullable=False, index=True)  # ObjectId str
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    attack_type = Column(String(100))
    title = Column(String(255), nullable=False)
    description = Column(String)
    ai_confidence = Column(Numeric(5,4))  # 0.0000 - 1.0000
    status = Column(String(20), server_default="open")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    assignee = relationship("User", back_populates="assigned_alerts")