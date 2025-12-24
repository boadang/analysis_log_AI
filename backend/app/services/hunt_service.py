from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path
import re
from datetime import datetime

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
from app.schemas.threat_hunt import (
    HuntScopeCreate,
    HuntConclusionCreate,
)
from app.models.user import User

VERDICT_MAP = {
    "confirmed_threat": "true_positive",
    "false_positive": "false_positive",
    "inconclusive": "inconclusive",
}

RISK_MAP = {
    "low": "low",
    "medium": "medium",
    "high": "high",
}

TIMESTAMP_REGEX = r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"

class HuntService:
    """
    Core Threat Hunting Service

    Nguyên tắc:
    - Chỉ xử lý nghiệp vụ + database
    - KHÔNG WebSocket
    - KHÔNG Redis
    - KHÔNG phụ thuộc FastAPI lifecycle
    """

    # =====================================================
    # DATASET / LOGS
    # =====================================================
    def get_dataset_logs(self, db: Session, user: User):
        return db.query(LogDataset).filter(LogDataset.created_by == user.id).all()

    def get_analysis_logs(
        self,
        db: Session,
        hunt_id: int,
        user_id: int,
        time_start=None,
        time_end=None,
    ) -> list[AnalysisLog]:

        hunt = self._get_hunt_or_404(db, hunt_id)

        dataset = (
            db.query(LogDataset)
            .filter(
                LogDataset.id == hunt.dataset_id,
                LogDataset.created_by == user_id
            )
            .one_or_none()
        )
        if not dataset:
            return []

        # 👉 AUTO PARSE (LAZY)
        count = (
            db.query(AnalysisLog)
            .filter(AnalysisLog.dataset_id == dataset.id)
            .count()
        )
        if count == 0:
            self._parse_dataset_logs(db, dataset)

        q = db.query(AnalysisLog).filter(
            AnalysisLog.dataset_id == dataset.id
        )

        if time_start:
            q = q.filter(AnalysisLog.timestamp >= time_start)

        if time_end:
            q = q.filter(AnalysisLog.timestamp <= time_end)

        return q.order_by(AnalysisLog.timestamp.asc()).all()

    def _parse_dataset_logs(self, db: Session, dataset: LogDataset):
        file_path = Path(dataset.file_path)
        if not file_path.exists():
            raise FileNotFoundError(dataset.file_path)

        buffer = []
        total = 0

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                ts = None
                m = re.search(TIMESTAMP_REGEX, line)
                if m:
                    ts = datetime.strptime(m.group(1), "%Y-%m-%d %H:%M:%S")

                buffer.append(
                    AnalysisLog(
                        dataset_id=dataset.id,
                        timestamp=ts,
                        raw_log=line,
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
            raise HTTPException(f"Dataset {scope.dataset_id} not found")

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
    ) -> HuntHypothesis:
        hunt = self._get_hunt_or_404(db, hunt_id)
        if hunt.status == "closed":
            raise HTTPException("Hunt already closed")

        text = data.get("hypothesis")
        techniques = data.get("techniques", [])

        if not text:
            raise HTTPException("Hypothesis is required")

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
        user_id: int,
    ) -> HuntExecution:
        from app.tasks.hunt_tasks import execute_hunt_task

        hunt = self._get_hunt_or_404(db, hunt_id)
        if hunt.status in ("completed", "closed"):
            raise HTTPException("Cannot execute closed hunt")

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
            args=[hunt_id, exec_obj.id, user_id],
            queue="default",
        )

        exec_obj.celery_task_id = task.id
        db.commit()
        return exec_obj

    def update_execution_status(
        self,
        db: Session,
        execution_id: int,
        status: str,
    ) -> HuntExecution:
        execution = (
            db.query(HuntExecution)
            .filter(HuntExecution.id == execution_id)
            .one_or_none()
        )
        if not execution:
            raise NoResultFound("Execution not found")

        execution.status = status
        if status in ("completed", "failed", "stopped"):
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
            raise HTTPException(status_code=400, detail="Hunt already closed")

        verdict = VERDICT_MAP[data["verdict"]]
        risk_level = RISK_MAP[data["confidence"]]

        conclusion = HuntConclusion(
            hunt_id=hunt_id,
            verdict=verdict,
            risk_level=risk_level,
            recommendation=data.get("recommendations"),
            closed_by=user_id,
            closed_at=datetime.utcnow(),
        )

        hunt.status = "closed"

        db.add(conclusion)
        db.commit()
        db.refresh(conclusion)

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
