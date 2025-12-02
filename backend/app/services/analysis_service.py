# backend/app/services/analysis_service.py
from app.crud.analysis_job import create_analysis
from app.tasks.analysis_worker import run_analysis_task
from app.database.postgres import AsyncSessionLocal

async def start_analysis(data, user_id: int):
    async with AsyncSessionLocal() as db:

        # 1. Lưu job vào DB
        analysis = await create_analysis(
            db,
            job_name=data.job_name,
            model_name=data.model_name,
            time_range_from=data.time_range_from,
            time_range_to=data.time_range_to,
            device_ids=data.device_ids,
            file_path=data.file_path,
            created_by=user_id
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
