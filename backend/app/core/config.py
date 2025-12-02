# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Postgres
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Celery
    CELERY_BROKER_URL: str | None = None
    CELERY_RESULT_BACKEND: str | None = None

    # Các field khác
    DATABASE_URL: str | None = None
    MONGO_URI: str | None = None
    JWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENVIRONMENT: str = "development"

    # CHỈ KHAI BÁO model_config MỘT LẦN DUY NHẤT
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # CHỈ MỘT __post_init__ DUY NHẤT
    def __post_init__(self) -> None:
        # 1. DATABASE_URL: luôn luôn phải là asyncpg cho FastAPI + SQLAlchemy async
        if not self.DATABASE_URL or "psycopg2" in self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

        # 2. Celery: vẫn dùng psycopg2 (vì Celery chưa hỗ trợ asyncpg ổn định)
        if not self.CELERY_BROKER_URL:
            self.CELERY_BROKER_URL = (
                f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        if not self.CELERY_RESULT_BACKEND:
            self.CELERY_RESULT_BACKEND = self.CELERY_BROKER_URL


# Khởi tạo settings
settings = Settings()