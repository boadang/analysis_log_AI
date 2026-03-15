from sqlalchemy.orm import Session
from datetime import datetime
from pathlib import Path
import traceback
import json

from app.models.log_dataset import LogDataset
from app.models.analysis_job import AnalysisJob
from app.models.analysis_log import AnalysisLog

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
    job_id: str,
    db: Session,
    log_file_path: str,
    chunk_size: int = 10,
):
    job_id_str = str(job_id)
    
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        print(f"[RUNNER] Job {job_id_str} not found")
        return

    # ======================================================
    # CREATE DATASET
    # ======================================================
    dataset = LogDataset(
        name=job.job_name,
        description=f"Dataset created from analysis job {job.id}",
        source_type="firewall",
        environment="prod",
        file_path=log_file_path,
        log_format="raw",
        time_range_start=job.time_range_from,
        time_range_end=job.time_range_to,
        created_from_job=job.id,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    print(f"[RUNNER] Dataset {dataset.id} created for job {job.id}")

    log_path = Path(log_file_path)
    if not log_path.exists():
        publish_error(job_id_str, f"Log file not found: {log_file_path}")
        return

    try:
        # ======================================================
        # START JOB
        # ======================================================
        job.status = "running"
        job.started_at = datetime.utcnow()
        db.commit()
        publish_status(job_id_str, "running")
        print(f"[RUNNER] Job {job_id_str} started")

        total_logs = 0
        detected_threats = 0
        analysis_results = []
        timeline = []

        risk_distribution = {
            "none": 0,
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0,
            "unknown": 0,
        }

        batch_logs = []
        batch_indexes = []

        # ======================================================
        # READ LOG FILE
        # ======================================================
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue

                total_logs += 1
                batch_logs.append(line)
                batch_indexes.append(idx)

                if len(batch_logs) >= chunk_size:
                    detected_threats = _process_batch(
                        job_id=job_id_str,
                        dataset_id=dataset.id,
                        batch_logs=batch_logs,
                        batch_indexes=batch_indexes,
                        analysis_results=analysis_results,
                        timeline=timeline,
                        risk_distribution=risk_distribution,
                        db=db,
                        publish_log_fn=publish_log,
                        detected_threats=detected_threats,
                    )

                    # Publish progress
                    publish_summary(job_id_str, {
                        "processed": total_logs,
                        "detected_threats": detected_threats,
                        "risk_distribution": risk_distribution,
                    })

                    batch_logs.clear()
                    batch_indexes.clear()

        # ======================================================
        # PROCESS REMAINING
        # ======================================================
        if batch_logs:
            detected_threats = _process_batch(
                job_id=job_id_str,
                dataset_id=dataset.id,
                batch_logs=batch_logs,
                batch_indexes=batch_indexes,
                analysis_results=analysis_results,
                timeline=timeline,
                risk_distribution=risk_distribution,
                db=db,
                publish_log_fn=publish_log,
                detected_threats=detected_threats,
            )

        print(f"[RUNNER] Processing completed: {total_logs} logs, {detected_threats} threats")

        # ======================================================
        # AGGREGATE
        # ======================================================
        aggregated = AIProcessor.aggregate_threats(analysis_results)
        timeline.sort(key=lambda x: RISK_ORDER.get(x.get("risk_level", "unknown"), 99))

        # ======================================================
        # UPDATE JOB - RE-FETCH để tránh detached instance
        # ======================================================
        print(f"[RUNNER] Preparing to update job status to completed")
        print(f"[RUNNER] Session info - active: {db.is_active}, dirty: {len(db.dirty)}, new: {len(db.new)}")
        
        # 🔥 FIX: Sử dụng session mới để update job
        # Refresh job để đảm bảo có instance mới nhất
        try:
            db.expire_all()  # Expire tất cả objects
            job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
            
            if not job:
                raise Exception(f"Job {job_id} disappeared from database!")
            
            print(f"[RUNNER] Job re-fetched: id={job.id}, current_status={job.status}")
            
            # Update all fields
            job.status = "completed"
            job.finished_at = datetime.utcnow()
            job.total_logs = total_logs
            job.detected_threats = detected_threats
            job.summary = aggregated
            job.timeline = timeline[:50]
            job.analysis_text = _build_report(
                total_logs,
                detected_threats,
                aggregated,
                risk_distribution,
            )
            
            print(f"[RUNNER] Job fields updated in memory")
            print(f"[RUNNER] New values: status={job.status}, total_logs={job.total_logs}, threats={job.detected_threats}")
            print(f"[RUNNER] Job in dirty set: {job in db.dirty}")
            
            # 🔥 Explicit flush before commit
            db.flush()
            print(f"[RUNNER] ✅ Job flushed to DB")
            
            # 🔥 Commit transaction
            db.commit()
            print(f"[RUNNER] ✅ Job committed to DB")
            
            # Verify in DB
            db.expire(job)
            verified_job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
            print(f"[RUNNER] ✅ Verified in DB: status={verified_job.status}, total_logs={verified_job.total_logs}")
            
            if verified_job.status != "completed":
                raise Exception(f"Job status not updated! Still: {verified_job.status}")
                
        except Exception as commit_error:
            print(f"[RUNNER] ❌ COMMIT FAILED: {commit_error}")
            traceback.print_exc()
            raise

        # Prepare WS payload
        job_data = {
            "summary": aggregated,
            "timeline": timeline[:50],
            "stats": {
                "total_logs": total_logs,
                "detected_threats": detected_threats,
            },
        }

        # ======================================================
        # PUBLISH WS MESSAGES
        # ======================================================
        try:
            print(f"[RUNNER] Publishing summary to channel job:{job_id_str}")
            publish_summary(job_id_str, aggregated)
            print(f"[RUNNER] ✅ Summary published")
            
            print(f"[RUNNER] Publishing timeline to channel job:{job_id_str}")
            publish_timeline(job_id_str, timeline[:50])
            print(f"[RUNNER] ✅ Timeline published")
            
            print(f"[RUNNER] Publishing completed to channel job:{job_id_str}")
            print(f"[RUNNER] Completed payload: {job_data}")
            publish_completed(job_id_str, job_data)
            print(f"[RUNNER] ✅ Completed published")
            
            print(f"[RUNNER] 🎉 All WS messages published successfully")
            
        except Exception as e:
            print(f"[RUNNER] ❌ WS publish error: {e}")
            traceback.print_exc()

        print(f"[RUNNER] Job {job_id_str} completed successfully")

    except Exception as e:
        print(f"[RUNNER] ❌ Job {job_id_str} FAILED: {e}")
        traceback.print_exc()
        
        # 🔥 Ensure we can still update job status to failed
        try:
            print(f"[RUNNER] Attempting to mark job as failed...")
            db.rollback()  # Rollback any pending changes
            
            # Re-fetch job with a fresh query
            job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.finished_at = datetime.utcnow()
                db.commit()
                print(f"[RUNNER] ✅ Job marked as failed in DB")
            else:
                print(f"[RUNNER] ❌ Could not find job to mark as failed")
                
            publish_error(job_id_str, str(e))
        except Exception as inner_e:
            print(f"[RUNNER] ❌ Error handling failed: {inner_e}")
            traceback.print_exc()


# ======================================================
# PROCESS BATCH + SAVE ANALYSIS LOGS
# ======================================================
def _process_batch(
    job_id: str,
    dataset_id: int,
    batch_logs: list[str],
    batch_indexes: list[int],
    analysis_results: list,
    timeline: list,
    risk_distribution: dict,
    db: Session,
    publish_log_fn,
    detected_threats: int,
) -> int:
    """
    Process a batch of logs with AI and save to database
    """
    try:
        results = AIProcessor.analyze_batch(batch_logs)
    except Exception as e:
        publish_log_fn(job_id, f"[ERROR] Batch AI failed: {e}")
        return detected_threats

    # ==============================
    # Build list of AnalysisLog objects
    # ==============================
    log_objects = []
    
    for i, result in enumerate(results):
        raw_log = batch_logs[i]
        line_idx = batch_indexes[i]

        risk = result.get("risk_level", "unknown")
        is_threat = result.get("is_threat", False)
        summary = result.get("summary", "")

        risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
        analysis_results.append(result)

        # Create AnalysisLog object
        log_row = AnalysisLog(
            job_id=job_id,
            dataset_id=dataset_id,
            raw_log=raw_log,
            parsed_result=json.dumps(result, ensure_ascii=False),
            threat_result=summary if is_threat else None,
        )
        log_objects.append(log_row)

        if is_threat:
            detected_threats += 1
            timeline.append({
                "index": line_idx,
                "timestamp": result.get("details", {}).get("timestamp"),
                "risk_level": risk,
                "threat_type": result.get("threat_type"),
                "summary": summary,
                "raw_log": raw_log[:120],
            })

        publish_log_fn(
            job_id,
            f"[{risk.upper()}] {raw_log[:80]} → {summary}"
        )

    # ==============================
    # Bulk insert để performance tốt hơn
    # ==============================
    try:
        db.bulk_save_objects(log_objects)
        db.flush()  # Ghi vào DB
        print(f"[RUNNER] 💾 Saved {len(log_objects)} analysis logs to DB")
    except Exception as e:
        print(f"[RUNNER] ⚠️ Failed to save analysis logs: {e}")
        traceback.print_exc()
        # Không raise exception để job vẫn tiếp tục
    
    return detected_threats


def _build_report(
    total_logs: int,
    detected_threats: int,
    aggregated: dict,
    risk_distribution: dict,
) -> str:
    """
    Build text report for analysis results
    """
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