from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
import json

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 dias

    ALLOWED_ORIGINS: List[str] = ["*"] # <- CORRIGIDO: Tem que ser Lista pro FastAPI

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()