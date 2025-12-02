# backend/app/database/postgres.py
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase

# Chỉ import settings, KHÔNG hardcode gì cả
from app.core.config import settings


# === ASYNC ENGINE (dùng cho FastAPI + async ORM) ===
# Dùng trực tiếp settings.DATABASE_URL → lúc này đã chắc chắn là asyncpg nhờ __post_init__
engine = create_async_engine(
    settings.DATABASE_URL,   # ← Đảm bảo 100% là postgresql+asyncpg://...
    echo=False,
    future=True,
    pool_size=20,
    max_overflow=40,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# === SYNC SESSION (nếu bạn vẫn cần dùng ở đâu đó, ví dụ migration Alembic, script sync, Celery sync task) ===
# Nếu không cần thì có thể bỏ phần này đi
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

sync_engine = create_engine(
    settings.CELERY_BROKER_URL.replace("postgresql+psycopg2", "postgresql+psycopg2"),  # giữ nguyên psycopg2
    echo=False,
    poolclass=NullPool,  # nếu dùng trong migration thì nên dùng NullPool
)

SessionLocal = sessionmaker(bind=sync_engine)

# Base cho models
class Base(DeclarativeBase):
    pass