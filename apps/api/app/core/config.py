from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:12345@localhost:5432/stockbot_db"
    JWT_SECRET: str = "stockbot-dev-secret-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    ALLOWED_ORIGINS: List[str] = ["http://127.0.0.1:8000", "http://localhost:3000"]

    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)

settings = Settings()
print(f"DEBUG CONFIG LOADED: DB={settings.DATABASE_URL}")
