# backend/app/models/threat_hunt.py
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Enum,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base


# ======================================================
# HUNT SESSION (ROOT ENTITY)
# ======================================================

class HuntSession(Base):
    __tablename__ = "hunt_sessions"

    id = Column(Integer, primary_key=True)

    # Scope
    name = Column(String(255), nullable=False)
    description = Column(Text)

    environment = Column(
        Enum("prod", "dev", "lab", name="hunt_environment"),
        default="prod",
        nullable=False,
    )

    time_range_start = Column(DateTime, nullable=False)
    time_range_end = Column(DateTime, nullable=False)

    # data_sources = Column(JSONB, nullable=True)
    # raw_logs = Column(JSONB)

    status = Column(
        Enum(
            "created",
            "running",
            "completed",
            "closed",
            name="hunt_status",
        ),
        default="created",
        nullable=False,
    )

    created_by = Column(Integer, nullable=False)  # SOC analyst id

    dataset_id = Column(
        Integer,
        ForeignKey("log_datasets.id", ondelete="RESTRICT"),
        nullable=False
    )
    
    # ---------------- RELATIONSHIPS ----------------
    
    hypothesis = relationship(
        "HuntHypothesis",
        back_populates="hunt",
        uselist=False,
        cascade="all, delete-orphan",
    )

    executions = relationship(
        "HuntExecution",
        back_populates="hunt",
        cascade="all, delete-orphan",
    )

    findings = relationship(
        "HuntFinding",
        back_populates="hunt",
        cascade="all, delete-orphan",
    )

    conclusion = relationship(
        "HuntConclusion",
        back_populates="hunt",
        uselist=False,
        cascade="all, delete-orphan",
    )


# ======================================================
# HYPOTHESIS (SOC CORE)
# ======================================================

class HuntHypothesis(Base):
    __tablename__ = "hunt_hypotheses"

    id = Column(Integer, primary_key=True)

    hunt_id = Column(
        Integer,
        ForeignKey("hunt_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    hypothesis = Column(Text, nullable=False)

    # MITRE ATT&CK techniques
    techniques = Column(JSONB, nullable=False)

    created_by = Column(Integer, nullable=False)

    hunt = relationship("HuntSession", back_populates="hypothesis")


# ======================================================
# EXECUTION (MANUAL / AI)
# ======================================================

class HuntExecution(Base):
    __tablename__ = "hunt_executions"

    id = Column(Integer, primary_key=True)

    hunt_id = Column(
        Integer,
        ForeignKey("hunt_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    mode = Column(
        Enum("manual", "ai-assisted", name="hunt_mode"),
        nullable=False,
    )

    depth = Column(
        Enum("quick", "standard", "deep", name="hunt_depth"),
        nullable=False,
    )

    strategy = Column(String(255))

    status = Column(
        Enum(
            "queued",
            "running",
            "completed",
            "paused",
            "stopped",
            "failed",
            name="hunt_execution_status",
        ),
        default="queued",
        nullable=False,
    )

    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    error = Column(Text)

    hunt = relationship("HuntSession", back_populates="executions")


# ======================================================
# FINDINGS (EVIDENCE)
# ======================================================

class HuntFinding(Base):
    __tablename__ = "hunt_findings"

    id = Column(Integer, primary_key=True)

    hunt_id = Column(
        Integer,
        ForeignKey("hunt_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    timestamp = Column(DateTime, nullable=False)
    source = Column(String(100), nullable=False)

    event = Column(Text, nullable=False)

    severity = Column(
        Enum("low", "medium", "high", "critical", name="finding_severity"),
        nullable=False,
    )

    confidence = Column(Integer, nullable=False)

    mitre_technique = Column(String(20))
    evidence = Column(JSONB)

    hunt = relationship("HuntSession", back_populates="findings")


# ======================================================
# CONCLUSION (CLOSE HUNT)
# ======================================================

class HuntConclusion(Base):
    __tablename__ = "hunt_conclusions"

    id = Column(Integer, primary_key=True)

    hunt_id = Column(
        Integer,
        ForeignKey("hunt_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    verdict = Column(
        Enum(
            "true_positive",
            "false_positive",
            "inconclusive",
            name="hunt_verdict",
        ),
        nullable=False,
    )

    risk_level = Column(
        Enum("low", "medium", "high", "critical", name="hunt_risk"),
        nullable=False,
    )

    recommendation = Column(Text)

    closed_by = Column(Integer, nullable=False)
    closed_at = Column(DateTime, default=datetime.utcnow)

    hunt = relationship("HuntSession", back_populates="conclusion")
