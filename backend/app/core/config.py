from typing import Any
from pydantic import field_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- Database Settings ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    
    # --- Redis Settings ---
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_DB_RS: int = 1

    # --- Auth & Security ---
    JWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENVIRONMENT: str = "development"

    # --- Ollama ---
    OLLAMA_MODEL: str = "qwen3:8b"
    OLLAMA_API_URL: str = "http://localhost:11434/api/generate"

    # --- Pydantic Config ---
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Validate cổng để tránh lỗi string -> int
    @field_validator('POSTGRES_PORT', 'REDIS_PORT', mode='before')
    @classmethod
    def parse_port(cls, v: Any) -> int:
        if isinstance(v, str):
            # Nếu Railway truyền dạng ${VAR}, ta phải xử lý hoặc báo lỗi
            if v.startswith('$'):
                raise ValueError(f"Biến môi trường đang bị lỗi format: {v}. Vui lòng nhập số trực tiếp trong Railway.")
            return int(v)
        return v

    # --- Computed URLs (Được tạo tự động từ các biến trên) ---
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @computed_field
    @property
    def CELERY_BROKER_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @computed_field
    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return f"db+postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()