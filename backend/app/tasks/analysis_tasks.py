# # backend/app/tasks/analysis_tasks.py
# from celery import shared_task
# from app.tasks.train.dataset_builder import build_dataset
# from app.tasks.train.fine_tune import run_fine_tuning
# from app.tasks.train.evaluator import evaluate_model
# from app.database.postgres import async_session
# from app.crud.analysis_job import update_analysis
# from app.core.celery_app import celery as celery_app
# import asyncio
# from datetime import datetime
# from sqlalchemy.orm import Session
# from app.database.postgres import SessionLocal
# from app.models.AnalysisJob import Analysis
# import time

# @shared_task
# def run_analysis_task(analysis_id: int, logs: list[str]):
#     """
#     1. Preprocess + build dataset
#     2. Fine-tune Ollama
#     3. Evaluate
#     4. Update DB
#     """
#     async def _run():
#         dataset = build_dataset(logs)
#         tuning_result = run_fine_tuning(dataset)
#         evaluation = evaluate_model(tuning_result["model_name"])

#         # Update DB
#         async with async_session() as db:
#             await update_analysis(
#                 db,
#                 analysis_id,
#                 status="completed",
#                 model_name=tuning_result["model_name"],
#                 total_logs=len(logs),
#                 detected_threats=sum([1 for e in evaluation if "threat" in e["output"].lower()]),
#                 finished_at=datetime.utcnow()
#             )

#     asyncio.run(_run())

# @celery_app.task(name="tasks.run_ai_analysis")
# def run_ai_analysis(analysis_id: int, file_path: str, model_name: str):
#     db: Session = SessionLocal()

#     job = db.query(Analysis).filter(Analysis.id == analysis_id).first()
#     if not job:
#         return

#     job.status = "running"
#     db.commit()

#     try:
#         # Giả lập xử lý AI
#         time.sleep(3)

#         job.total_logs = 1234
#         job.detected_threats = 12
#         job.status = "completed"

#     except Exception:
#         job.status = "failed"

#     finally:
#         db.commit()
#         db.close()
