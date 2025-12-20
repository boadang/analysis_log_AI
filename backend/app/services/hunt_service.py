# backend/app/services/hunt_service.py
from datetime import datetime
from typing import List, Dict, Any
from fastapi import HTTPException

import asyncio
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound

from app.core.hunt_ws_manager import ws_manager
from app.models.threat_hunt import (
    HuntSession,
    HuntHypothesis,
    HuntExecution,
    HuntFinding,
    HuntConclusion,
)
from app.models.log_dataset import LogDataset
from app.models.analysis_log import AnalysisLog
from app.schemas.threat_hunt import HuntScopeCreate

class HuntService:
    """
    Core Threat Hunting Service

    Rules:
    - Không import FastAPI
    - Không import Celery task
    - Chỉ xử lý nghiệp vụ
    """
    
    def get_dataset_logs(self, db: Session):
        return (
            db.query(LogDataset)
            .all()
        )

    # =====================================================
    # ANALYSIS LOGS
    # =====================================================
    def get_analysis_logs(self, db: Session, hunt_id: int):
        hunt = self._get_hunt_or_404(db, hunt_id)

        return (
            db.query(AnalysisLog)
            .filter(AnalysisLog.dataset_id == hunt.dataset_id)
            .order_by(AnalysisLog.id.asc())
            .all()
        )

    # =====================================================
    # CREATE HUNT
    # =====================================================
    def create_hunt(
        self,
        db: Session,
        scope: HuntScopeCreate,
        user_id: int
    ) -> HuntSession:
        dataset = (
            db.query(LogDataset)
            .filter(LogDataset.id == scope.dataset_id)
            .one_or_none()
        )
        if not dataset:
            raise ValueError("Dataset not found")

        hunt = HuntSession(
            name=scope.name,
            description=scope.description,
            environment=scope.environment,
            time_range_start=scope.time_range_start,
            time_range_end=scope.time_range_end,
            dataset_id=dataset.id,
            created_by=user_id,
            status="created",
        )

        db.add(hunt)
        db.commit()
        db.refresh(hunt)
        return hunt

    # =====================================================
    # HYPOTHESIS
    # =====================================================
    def save_hypothesis(
        self,
        db: Session,
        hunt_id: int,
        data: Dict[str, Any],
        user_id: int
    ):
        hunt = self._get_hunt_or_404(db, hunt_id)
        if hunt.status == "closed":
            raise ValueError("Hunt already closed")

        hypothesis_text = data.get("hypothesis")
        techniques = data.get("techniques", [])

        if not hypothesis_text:
            raise ValueError("Hypothesis is required")

        hypothesis = (
            db.query(HuntHypothesis)
            .filter(HuntHypothesis.hunt_id == hunt_id)
            .one_or_none()
        )

        if hypothesis:
            if hypothesis.created_by != user_id:
                raise PermissionError("Not allowed to edit hypothesis")

            hypothesis.hypothesis = hypothesis_text
            hypothesis.techniques = techniques
            hypothesis.updated_at = datetime.utcnow()
        else:
            hypothesis = HuntHypothesis(
                hunt_id=hunt_id,
                hypothesis=hypothesis_text,
                techniques=techniques,
                created_by=user_id,
            )
            db.add(hypothesis)

        db.commit()
        db.refresh(hypothesis)
        return hypothesis

    # =====================================================
    # EXECUTION (DB ONLY – KHÔNG TRIGGER TASK)
    # =====================================================
    def create_execution(
        self,
        db: Session,
        hunt_id: int,
        execution: Dict[str, Any]
    ) -> HuntExecution:
        from app.tasks.hunt_tasks import execute_hunt_task
        
        hunt = self._get_hunt_or_404(db, hunt_id)
        if hunt.status in ("completed", "closed"):
            raise ValueError("Cannot execute closed hunt")

        exec_obj = HuntExecution(
            hunt_id=hunt_id,
            mode=execution["mode"],
            depth=execution["depth"],
            strategy=execution.get("strategy"),
            status="queued",
            started_at=datetime.utcnow(),
        )

        hunt.status = "running"
        print("[HUNT_SERVICE] hunt status:", hunt.status)
        db.add(exec_obj)
        db.commit()
        db.refresh(exec_obj)
        
        execute_hunt_task.apply_async(
            args=[hunt_id, exec_obj.id],
            queue="default"
        )

        return exec_obj

    def update_execution_status(
        self,
        db: Session,
        execution_id: int,
        status: str
    ):
        execution = (
            db.query(HuntExecution)
            .filter(HuntExecution.id == execution_id)
            .one_or_none()
        )
        if not execution:
            raise NoResultFound("Execution not found")

        execution.status = status
        if status == "completed":
            execution.finished_at = datetime.utcnow()

        db.commit()
        db.refresh(execution)
        return execution

    # =====================================================
    # FINDINGS
    # =====================================================
    def add_finding(
        self,
        db: Session,
        hunt_id: int,
        finding_data: Dict[str, Any]
    ) -> HuntFinding:
        self._get_hunt_or_404(db, hunt_id)

        finding = HuntFinding(
            hunt_id=hunt_id,
            **finding_data
        )

        db.add(finding)
        db.commit()
        db.refresh(finding)

        self._safe_ws_push(
            hunt_id,
            {
                "type": "finding",
                "item": {
                    "timestamp": finding.timestamp.isoformat(),
                    "source": finding.source,
                    "event": finding.event,
                    "severity": finding.severity,
                    "confidence": finding.confidence,
                    "mitre_technique": finding.mitre_technique,
                },
            },
        )

        return finding

    def get_findings(self, db: Session, hunt_id: int) -> Dict[str, Any]:
        self._get_hunt_or_404(db, hunt_id)

        items = (
            db.query(HuntFinding)
            .filter(HuntFinding.hunt_id == hunt_id)
            .order_by(HuntFinding.timestamp.desc())
            .all()
        )

        return {
            "hunt_id": hunt_id,
            "items": items,
            "summary": self._build_summary(items),
        }

    # =====================================================
    # CONCLUDE
    # =====================================================
    def conclude_hunt(
        self,
        db: Session,
        hunt_id: int,
        data: Dict[str, Any],
        user_id: int
    ) -> HuntConclusion:
        hunt = self._get_hunt_or_404(db, hunt_id)
        if hunt.status == "closed":
            raise ValueError("Hunt already closed")

        conclusion = HuntConclusion(
            hunt_id=hunt_id,
            verdict=data["verdict"],
            risk_level=data["risk_level"],
            recommendation=data.get("recommendation"),
            closed_by=user_id,
            closed_at=datetime.utcnow(),
        )

        hunt.status = "closed"
        db.add(conclusion)
        db.commit()
        db.refresh(conclusion)
        return conclusion

    # =====================================================
    # INTERNAL HELPERS
    # =====================================================
    def _get_hunt_or_404(self, db: Session, hunt_id: int) -> HuntSession:
        hunt = (
            db.query(HuntSession)
            .filter(HuntSession.id == hunt_id)
            .one_or_none()
        )
        if not hunt:
            raise NoResultFound(f"Hunt {hunt_id} not found")
        return hunt

    def _build_summary(self, findings: List[HuntFinding]) -> Dict[str, int]:
        summary = {
            "total": len(findings),
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0,
        }
        for f in findings:
            if f.severity in summary:
                summary[f.severity] += 1
        return summary

    def _safe_ws_push(self, hunt_id: int, payload: Dict[str, Any]):
        """
        Push WS safely (không crash worker / API)
        """
        if not ws_manager.active_connections.get(hunt_id):
            return

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(ws_manager.broadcast(hunt_id, payload))
        except RuntimeError:
            asyncio.run(ws_manager.broadcast(hunt_id, payload))
            
    def pause_execution(
        self,
        db: Session,
        hunt_id: int,
        execution_id: int,
    ):
        execution = (
            db.query(HuntExecution)
            .filter(
                HuntExecution.id == execution_id,
                HuntExecution.hunt_id == hunt_id,
                HuntExecution.status == "running",
            )
            .one_or_none()
        )

        if not execution:
            raise HTTPException(404, "Execution not found")

        if execution.status != "running":
            raise HTTPException(
                400,
                f"Cannot pause execution in status {execution.status}"
            )

        execution.status = "paused"
        db.commit()
        db.refresh(execution)

        return execution

    def stop_execution(
        self,
        db: Session,
        hunt_id: int,
        execution_id: int,
    ):
        execution = (
            db.query(HuntExecution)
            .filter(
                HuntExecution.id == execution_id,
                HuntExecution.hunt_id == hunt_id,
            )
            .one_or_none()
        )

        if not execution:
            raise ValueError("Execution not found")

        execution.status = "stopped"
        execution.finished_at = datetime.utcnow()

        db.commit()
        db.refresh(execution)

        return execution


            
    def get_latest_execution_status(
        self,
        db: Session,
        hunt_id: int,
    ) -> str | None:
        execution = (
            db.query(HuntExecution)
            .filter(HuntExecution.hunt_id == hunt_id)
            .order_by(HuntExecution.id.desc())
            .first()
        )

        return execution.status if execution else None

                
