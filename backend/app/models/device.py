# backend/app/models/device.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.dtypes import IPAddress
from app.database.postgres import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=False)  # INET → dùng String hoặc CIDR
    vendor = Column(String(50))
    model = Column(String(100))
    description = Column(String)
    is_active = Column(Boolean, default=True)
    added_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())