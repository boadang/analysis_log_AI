from sqlalchemy.orm import Session
from datetime import datetime
from pathlib import Path
import traceback

from app.models.analysis_job import AnalysisJob
from app.services.ai_processor import AIProcessor
from app.services.ws_publisher_sync import (
    publish_status,
    publish_log,
    publish_summary,
    publish_timeline,
    publish_completed,
    publish_error,
)

RISK_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "none": 4,
    "unknown": 5,
}


def run_analysis_job(
    job_id: int,
    db: Session,
    log_file_path: str,
    chunk_size: int = 5,
):

    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        print(f"[RUNNER] Job {job_id} not found")
        return

    log_path = Path(log_file_path)
    if not log_path.exists():
        publish_error(job_id, f"Log file not found: {log_file_path}")
        return

    try:
        # START JOB
        job.status = "running"
        job.started_at = datetime.utcnow()
        db.commit()
        publish_status(job_id, "running")

        total_logs = 0
        detected_threats = 0
        analysis_results = []
        timeline = []

        risk_distribution = {k: 0 for k in ["none", "low", "medium", "high", "critical", "unknown"]}

        batch_logs = []
        batch_indexes = []

        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue

                total_logs += 1
                batch_logs.append(line)
                batch_indexes.append(idx)

                if len(batch_logs) >= chunk_size:
                    detected_threats_ref = [detected_threats]
                    _process_batch(
                        job_id,
                        batch_logs,
                        batch_indexes,
                        analysis_results,
                        timeline,
                        risk_distribution,
                        db,
                        publish_log,
                        detected_threats_ref=detected_threats_ref
                    )
                    detected_threats = detected_threats_ref[0]

                    publish_summary(job_id, {
                        "processed": total_logs,
                        "detected_threats": detected_threats,
                        "risk_distribution": risk_distribution,
                    })

                    batch_logs.clear()
                    batch_indexes.clear()

        # PROCESS REMAINING LOGS
        if batch_logs:
            detected_threats_ref = [detected_threats]
            _process_batch(
                job_id,
                batch_logs,
                batch_indexes,
                analysis_results,
                timeline,
                risk_distribution,
                db,
                publish_log,
                detected_threats_ref=detected_threats_ref
            )
            detected_threats = detected_threats_ref[0]

        # AGGREGATE
        aggregated = AIProcessor.aggregate_threats(analysis_results)
        timeline.sort(key=lambda x: RISK_ORDER.get(x.get("risk_level", "unknown"), 99))

        # UPDATE DB
        job.status = "completed"
        job.finished_at = datetime.utcnow()
        job.total_logs = total_logs
        job.detected_threats = detected_threats
        job.summary = aggregated
        job.timeline = timeline[:50]
        job.analysis_text = _build_report(total_logs, detected_threats, aggregated, risk_distribution)
        db.commit()  # commit trước khi publish WS
        print(f"[RUNNER] Job {job_id} DB updated")
        print(f"Data details: {job}")
        
        # snapshot dict
        job_data = {
            "summary": job.summary,
            "timeline": job.timeline,
            "stats": {
                "total_logs": job.total_logs,
                "detected_threats": job.detected_threats
            }
        }

        try:
            publish_summary(job_id, aggregated)
            publish_timeline(job_id, timeline[:50])
            publish_completed(job_id, job_data)  # truyền dict thay vì object
        except Exception as e:
            print(f"[RUNNER] WS publish error for job {job_id}: {e}")

        print(f"[RUNNER] Job {job_id} completed")

    except Exception as e:
        print(f"[RUNNER] Job {job_id} FAILED")
        traceback.print_exc()
        db.rollback()
        job.status = "failed"
        db.commit()
        publish_error(job_id, str(e))


def _process_batch(
    job_id: int,
    batch_logs: list[str],
    batch_indexes: list[int],
    analysis_results: list,
    timeline: list,
    risk_distribution: dict,
    db: Session,
    publish_log_fn,
    detected_threats_ref=None,
):
    """
    Process one AI batch safely.
    """
    if detected_threats_ref is None:
        detected_threats_ref = [0]

    try:
        results = AIProcessor.analyze_batch(batch_logs)
    except Exception as e:
        publish_log_fn(job_id, f"[ERROR] Batch AI failed: {e}")
        return

    for i, result in enumerate(results):
        raw_log = batch_logs[i]
        line_idx = batch_indexes[i]

        risk = result.get("risk_level", "unknown")
        is_threat = result.get("is_threat", False)
        summary = result.get("summary", "")

        risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
        analysis_results.append(result)

        if is_threat:
            detected_threats_ref[0] += 1
            timeline.append({
                "index": line_idx,
                "timestamp": result.get("details", {}).get("timestamp"),
                "risk_level": risk,
                "threat_type": result.get("threat_type"),
                "summary": summary,
                "raw_log": raw_log[:120],
            })

        publish_log_fn(job_id, f"[{risk.upper()}] {raw_log[:80]} → {summary}")


def _build_report(total_logs: int, detected_threats: int, aggregated: dict, risk_distribution: dict) -> str:
    return f"""
=== AI ANALYSIS REPORT ===

Total logs analyzed : {total_logs}
Threats detected    : {detected_threats} ({aggregated.get("threat_percentage", 0)}%)

Risk distribution:
- Critical : {risk_distribution.get("critical", 0)}
- High     : {risk_distribution.get("high", 0)}
- Medium   : {risk_distribution.get("medium", 0)}
- Low      : {risk_distribution.get("low", 0)}
- None     : {risk_distribution.get("none", 0)}

Threat types:
{chr(10).join(f"- {k}: {v}" for k, v in aggregated.get("threat_types", {}).items())}

Average confidence: {aggregated.get("average_confidence")}
""".strip()
