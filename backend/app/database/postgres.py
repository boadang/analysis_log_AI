# backend/app/database/postgres.py
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase
from app.models import *

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

# Sync engine chỉ dùng cho Alembic — luôn dùng PostgreSQL
POSTGRES_SYNC_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

sync_engine = create_engine(
    POSTGRES_SYNC_URL,
    echo=False,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)

# Base cho models
class Base(DeclarativeBase):
    pass