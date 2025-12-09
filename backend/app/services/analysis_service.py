# backend/app/services/analysis_service.py
from app.crud.analysis_job import create_analysis
from app.tasks.analysis_worker import run_analysis_task
from app.database.postgres import AsyncSessionLocal
from pathlib import Path

async def start_analysis(data, current_user_id: int):
    async with AsyncSessionLocal() as db:
        abs_path = str(Path(data.file_path).resolve())  
        data.file_path = abs_path

        # 1. Lưu job vào DB
        analysis = await create_analysis(
            db,
            job_name=data.job_name,
            model_name=data.model_name,
            file_path=data.file_path,
            time_range_from=data.time_range_from,
            time_range_to=data.time_range_to,
            device_ids=data.device_ids,
            created_by=current_user_id
        )


    # 2. Gửi task cho Celery
    run_analysis_task.delay(
        analysis.id,
        data.file_path,
        data.model_name,
        data.time_range_from,
        data.time_range_to,
        data.device_ids
    )

    return analysis
