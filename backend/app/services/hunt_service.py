from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path
import asyncio

from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from fastapi import HTTPException

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

    Quy ước:
    - Chỉ xử lý nghiệp vụ
    - Không phụ thuộc WebSocket / FastAPI lifecycle
    - Realtime đi qua Redis bridge
    """

    # =====================================================
    # INTERNAL – REDIS WS EMIT (SAFE)
    # =====================================================
    @staticmethod
    def _emit_ws(hunt_id: int, payload: dict):
        """
        Publish realtime event cho Hunt WS
        (qua Redis – giống AI Analysis)
        """
        try:
            from app.core.hunt_ws_emitter import hunt_ws_emit
            hunt_ws_emit(hunt_id, payload)
        except Exception as e:
            print(f"⚠️ [HUNT_SERVICE] WS emit failed: {e}")

    # =====================================================
    # DATASET / LOGS
    # =====================================================
    def get_dataset_logs(self, db: Session):
        return db.query(LogDataset).all()

    def get_analysis_logs(self, db: Session, hunt_id: int):
        hunt = self._get_hunt_or_404(db, hunt_id)

        if not hunt.dataset_id:
            return []

        dataset = (
            db.query(LogDataset)
            .filter(LogDataset.id == hunt.dataset_id)
            .one_or_none()
        )
        if not dataset:
            return []

        existing_count = (
            db.query(AnalysisLog)
            .filter(AnalysisLog.dataset_id == dataset.id)
            .count()
        )

        # Auto-parse nếu chưa có logs
        if existing_count == 0:
            self._parse_dataset_logs(db, dataset)

        return (
            db.query(AnalysisLog)
            .filter(AnalysisLog.dataset_id == dataset.id)
            .order_by(AnalysisLog.id.asc())
            .all()
        )

    def _parse_dataset_logs(self, db: Session, dataset: LogDataset):
        """
        Parse raw log file → analysis_logs
        """
        file_path = Path(dataset.file_path)
        if not file_path.exists():
            raise FileNotFoundError(dataset.file_path)

        buffer: list[AnalysisLog] = []
        total = 0

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                buffer.append(
                    AnalysisLog(
                        dataset_id=dataset.id,
                        job_id=None,
                        raw_log=line,
                        parsed_result=None,
                        threat_result=None,
                    )
                )
                total += 1

                if len(buffer) >= 1000:
                    db.bulk_save_objects(buffer)
                    db.commit()
                    buffer.clear()

        if buffer:
            db.bulk_save_objects(buffer)
            db.commit()

        dataset.log_count = total
        db.commit()

    # =====================================================
    # HUNT SESSION
    # =====================================================
    def create_hunt(
        self,
        db: Session,
        scope: HuntScopeCreate,
        user_id: int,
    ) -> HuntSession:
        dataset = (
            db.query(LogDataset)
            .filter(LogDataset.id == scope.dataset_id)
            .one_or_none()
        )
        if not dataset:
            raise ValueError(f"Dataset {scope.dataset_id} not found")

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
        user_id: int,
    ):
        hunt = self._get_hunt_or_404(db, hunt_id)
        if hunt.status == "closed":
            raise ValueError("Hunt already closed")

        text = data.get("hypothesis")
        techniques = data.get("techniques", [])

        if not text:
            raise ValueError("Hypothesis is required")

        hypothesis = (
            db.query(HuntHypothesis)
            .filter(HuntHypothesis.hunt_id == hunt_id)
            .one_or_none()
        )

        if hypothesis:
            if hypothesis.created_by != user_id:
                raise PermissionError("Not allowed")
            hypothesis.hypothesis = text
            hypothesis.techniques = techniques
            hypothesis.updated_at = datetime.utcnow()
        else:
            hypothesis = HuntHypothesis(
                hunt_id=hunt_id,
                hypothesis=text,
                techniques=techniques,
                created_by=user_id,
            )
            db.add(hypothesis)

        db.commit()
        db.refresh(hypothesis)
        return hypothesis

    # =====================================================
    # EXECUTION
    # =====================================================
    def create_execution(
        self,
        db: Session,
        hunt_id: int,
        execution: Dict[str, Any],
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
        db.add(exec_obj)
        db.commit()
        db.refresh(exec_obj)

        task = execute_hunt_task.apply_async(
            args=[hunt_id, exec_obj.id],
            queue="default",
        )

        exec_obj.celery_task_id = task.id
        db.commit()

        # 🔔 Realtime notify
        self._emit_ws(
            hunt_id,
            {
                "type": "execution_started",
                "execution_id": exec_obj.id,
                "status": "running",
            },
        )

        return exec_obj

    def update_execution_status(
        self,
        db: Session,
        execution_id: int,
        status: str,
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

        self._emit_ws(
            execution.hunt_id,
            {
                "type": "execution_status",
                "execution_id": execution.id,
                "status": status,
            },
        )

        return execution

    # =====================================================
    # FINDINGS
    # =====================================================
    def add_finding(
        self,
        db: Session,
        hunt_id: int,
        finding_data: Dict[str, Any],
    ) -> HuntFinding:
        self._get_hunt_or_404(db, hunt_id)

        finding = HuntFinding(
            hunt_id=hunt_id,
            **finding_data,
        )

        db.add(finding)
        db.commit()
        db.refresh(finding)

        self._emit_ws(
            hunt_id,
            {
                "type": "finding_added",
                "item": {
                    "id": finding.id,
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
    # CONCLUSION
    # =====================================================
    def conclude_hunt(
        self,
        db: Session,
        hunt_id: int,
        data: Dict[str, Any],
        user_id: int,
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

        self._emit_ws(
            hunt_id,
            {"type": "hunt_closed"},
        )

        return conclusion

    # =====================================================
    # PAUSE / STOP
    # =====================================================
    def pause_execution(self, db: Session, hunt_id: int, execution_id: int):
        execution = self._get_execution(db, hunt_id, execution_id)
        if execution.status != "running":
            raise HTTPException(400, "Execution not running")

        execution.status = "paused"
        db.commit()
        db.refresh(execution)

        self._emit_ws(hunt_id, {"type": "status", "status": "paused"})
        return execution

    def stop_execution(self, db: Session, hunt_id: int, execution_id: int):
        from app.core.celery_app import celery_app

        execution = self._get_execution(db, hunt_id, execution_id)

        if execution.celery_task_id:
            celery_app.control.revoke(
                execution.celery_task_id,
                terminate=True,
                signal="SIGKILL",
            )

        execution.status = "stopped"
        execution.finished_at = datetime.utcnow()
        db.commit()
        db.refresh(execution)

        self._emit_ws(hunt_id, {"type": "status", "status": "stopped"})
        return execution

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

    def _get_execution(
        self,
        db: Session,
        hunt_id: int,
        execution_id: int,
    ) -> HuntExecution:
        execution = (
            db.query(HuntExecution)
            .filter(
                HuntExecution.id == execution_id,
                HuntExecution.hunt_id == hunt_id,
            )
            .one_or_none()
        )
        if not execution:
            raise NoResultFound("Execution not found")
        return execution

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
