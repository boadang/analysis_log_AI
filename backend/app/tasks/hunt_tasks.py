# backend/app/tasks/hunt_task.py

from datetime import datetime
from typing import List
import time

from app.core.celery_app import celery_app
from app.database.postgres import SessionLocal

from app.services.hunt_service import HuntService
from app.services.ai_processor import AIProcessor
from app.models.threat_hunt import HuntExecution

from app.core.redis_ws_bridge import publish_to_hunt


@celery_app.task(
    bind=True,
    name="hunt.execute",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
)
def execute_hunt_task(self, hunt_id: int, execution_id: int, user_id: int):
    db = SessionLocal()
    service = HuntService()

    try:
        # ===============================
        # LOAD EXECUTION
        # ===============================
        execution: HuntExecution = (
            db.query(HuntExecution)
            .filter(HuntExecution.id == execution_id)
            .one()
        )

        execution.status = "running"
        execution.started_at = datetime.utcnow()
        db.commit()

        _ws_status(hunt_id, "running")

        # ===============================
        # LOAD LOGS
        # ===============================
        logs = service.get_analysis_logs(db, hunt_id, user_id)
        raw_logs: List[str] = [l.raw_log for l in logs]

        total = len(raw_logs)
        _ws_progress(hunt_id, 0, total)

        if total == 0:
            _finish(db, service, execution, hunt_id, user_id)
            return

        # ===============================
        # AI ANALYSIS
        # ===============================
        BATCH_SIZE = 20
        processed = 0
        saved_findings = 0

        for i in range(0, total, BATCH_SIZE):
            db.expire(execution)
            execution = db.query(HuntExecution).get(execution_id)

            # ⏸ Pause
            if execution.status == "paused":
                _ws_status(hunt_id, "paused")
                while True:
                    time.sleep(2)
                    db.expire(execution)
                    execution = db.query(HuntExecution).get(execution_id)
                    if execution.status == "running":
                        _ws_status(hunt_id, "running")
                        break
                    if execution.status == "stopped":
                        _ws_status(hunt_id, "stopped")
                        return

            # ⏹ Stop
            if execution.status == "stopped":
                _ws_status(hunt_id, "stopped")
                return

            batch = raw_logs[i : i + BATCH_SIZE]
            results = AIProcessor.analyze_batch(batch)

            for raw, result in zip(batch, results):
                if not result.get("is_threat"):
                    continue

                try:
                    finding = service.add_finding(
                        db,
                        hunt_id,
                        {
                            "timestamp": datetime.utcnow(),
                            "source": "AI",
                            "event": raw[:500],
                            "severity": result["risk_level"],
                            "confidence": int(result.get("confidence", 0)),
                            "mitre_technique": result.get("threat_type", "unknown")[:50],
                            "evidence": result,
                        },
                    )
                    saved_findings += 1
                    
                    # 🔥 EMIT FINDING MỚI QUA WEBSOCKET
                    _ws_finding(hunt_id, finding)
                    
                except Exception:
                    db.rollback()

            processed += len(batch)
            _ws_progress(hunt_id, processed, total)

        _finish(db, service, execution, hunt_id, user_id)

    except Exception as e:
        _fail(db, execution, hunt_id, str(e))
        raise
    finally:
        db.close()


# ======================================================
# REDIS EVENTS
# ======================================================

def _ws_finding(hunt_id: int, finding):
    """
    Emit finding mới qua WebSocket
    """
    publish_to_hunt(hunt_id, {
        "type": "finding",
        "item": {
            "id": finding.id,
            "timestamp": finding.timestamp.isoformat() if finding.timestamp else None,
            "event": finding.event,
            "severity": finding.severity,
            "confidence": finding.confidence,
            "mitre_technique": finding.mitre_technique,
            "source": finding.source,
        }
    })

def _ws_status(hunt_id: int, status: str):
    publish_to_hunt(hunt_id, {
        "type": "status",
        "status": status,
    })


def _ws_progress(hunt_id: int, processed: int, total: int):
    publish_to_hunt(hunt_id, {
        "type": "progress",
        "processed": processed,
        "total": total,
    })


def _ws_completed(hunt_id: int, summary: dict):
    publish_to_hunt(hunt_id, {
        "type": "completed",
        "summary": summary,
    })


def _finish(db, service, execution, hunt_id: int, user_id:int):
    execution.status = "completed"
    execution.finished_at = datetime.utcnow()
    hunt = service._get_hunt_or_404(db, hunt_id)
    hunt.status = "completed"
    db.commit()

    findings = service.get_findings(db, hunt_id)
    items = findings.get("items", [])
    detected = len([f for f in items if f.severity and f.severity != "low"])

    _ws_completed(hunt_id, {
        "total_logs": len(service.get_analysis_logs(db, hunt_id,user_id)),
        "detected_threats": detected,
    })


def _fail(db, execution, hunt_id: int, error: str):
    execution.status = "failed"
    execution.finished_at = datetime.utcnow()
    execution.hunt.status = "failed"
    db.commit()

    publish_to_hunt(hunt_id, {
        "type": "error",
        "error": error,
    })
