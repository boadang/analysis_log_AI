# backend/app/tasks/hunt_task.py
from datetime import datetime
from typing import List

from app.core.celery_app import celery_app
from app.database.postgres import SessionLocal

from app.services.hunt_service import HuntService
from app.services.ai_processor import AIProcessor
from app.models.threat_hunt import HuntExecution
from app.services.ws_publisher_sync import publish_status, publish_summary, publish_error, publish_completed

@celery_app.task(
    bind=True,
    name="hunt.excute",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
)
def execute_hunt_task(
    self,
    hunt_id: int,
    execution_id: int,
):
    db = SessionLocal()
    service = HuntService()

    try:
        # =====================================================
        # LOAD EXECUTION
        # =====================================================
        execution: HuntExecution = (
            db.query(HuntExecution)
            .filter(HuntExecution.id == execution_id)
            .one()
        )

        execution.status = "running"
        execution.started_at = datetime.utcnow()
        db.commit()

        _ws_status(hunt_id, "running")

        # =====================================================
        # LOAD LOGS (FROM DATASET)
        # =====================================================
        logs = service.get_analysis_logs(db, hunt_id)
        raw_logs: List[str] = [l.raw_log for l in logs]

        total = len(raw_logs)
        _ws_progress(hunt_id, 0, total)

        if total == 0:
            _finish(db, service, execution, hunt_id)
            return

        # =====================================================
        # AI BATCH ANALYSIS
        # =====================================================
        BATCH_SIZE = 20
        processed = 0

        for i in range(0, total, BATCH_SIZE):
            batch = raw_logs[i : i + BATCH_SIZE]

            results = AIProcessor.analyze_batch(batch)

            for raw, result in zip(batch, results):
                if not result.get("is_threat"):
                    continue

                service.add_finding(
                    db,
                    hunt_id,
                    {
                        "timestamp": datetime.utcnow(),
                        "source": "AI",
                        "event": raw,
                        "severity": result["risk_level"],
                        "confidence": int(result["confidence"] * 100),
                        "mitre_technique": result.get("threat_type"),
                        "evidence": result,
                    },
                )

            processed += len(batch)
            _ws_progress(hunt_id, processed, total)

        # =====================================================
        # FINISH
        # =====================================================
        _finish(db, service, execution, hunt_id)

    except Exception as e:
        _fail(db, execution, hunt_id, str(e))
        raise

    finally:
        db.close()


# =====================================================
# HELPER FUNCTIONS (Dùng Redis)
# =====================================================
def _ws_status(hunt_id: int, status: str):
    publish_status(hunt_id, status)

def _ws_progress(hunt_id: int, processed: int, total: int):
    publish_summary(hunt_id, {"processed": processed, "total": total})

def _finish(db, service, execution, hunt_id: int):
    execution.status = "completed"
    execution.finished_at = datetime.utcnow()
    hunt = service._get_hunt_or_404(db, hunt_id)
    hunt.status = "completed"
    db.commit()
    publish_completed(hunt_id, {
        "total_logs": len(service.get_analysis_logs(db, hunt_id)),
        "detected_threats": len([f for f in service.get_findings(db, hunt_id)["items"] if f.severity])
    })

def _fail(db, execution, hunt_id: int, error: str):
    try:
        execution.status = "failed"
        execution.finished_at = datetime.utcnow()
        hunt = execution.hunt
        hunt.status = "failed"
        db.commit()
    except Exception:
        pass
    publish_error(hunt_id, error)
