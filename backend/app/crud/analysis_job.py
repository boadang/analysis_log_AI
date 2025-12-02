# app/crud/analysis_job.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.AnalysisJob import Analysis
from datetime import datetime

async def create_analysis(
    db: AsyncSession,
    job_name: str,
    model_name: str,
    created_by: int,
    device_ids: list[int] = None,
    time_range_from: datetime = None,
    time_range_to: datetime = None
):
    analysis = Analysis(
        job_name=job_name,
        model_name=model_name,
        created_by=created_by,
        device_ids=device_ids,
        time_range_from=time_range_from,
        time_range_to=time_range_to,
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis

async def update_analysis(db: AsyncSession, analysis_id: int, **kwargs):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        return None
    for key, value in kwargs.items():
        setattr(analysis, key, value)
    await db.commit()
    await db.refresh(analysis)
    return analysis

async def get_analysis(db: AsyncSession, analysis_id: int):
    return await db.get(Analysis, analysis_id)

async def list_recent_analyses(db: AsyncSession, limit: int = 10):
    result = await db.execute(
        select(Analysis).order_by(Analysis.started_at.desc()).limit(limit)
    )
    return result.scalars().all()
