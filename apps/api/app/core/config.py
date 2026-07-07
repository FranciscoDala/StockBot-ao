from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

def parse_cors(v: str) -> List[str]:
    if not v:
        return []
    # aceita tanto "a,b,c" quanto '["a","b"]'
    v = v.strip()
    if v.startswith("["):
        import json
        return json.loads(v)
    return [i.strip() for i in v.split(",") if i.strip()]

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:12345@localhost:5432/stockbot_db"
    JWT_SECRET: str = "stockbot-dev-secret-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    BASE_URL: str = ""

    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)

    @classmethod
    def settings_customise_sources(cls, settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings):
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            file_secret_settings,
        )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Força o parse do CORS
        cors_env = os.getenv("ALLOWED_ORIGINS")
        if cors_env:
            self.ALLOWED_ORIGINS = parse_cors(cors_env)

settings = Settings()
print(f"DEBUG CONFIG LOADED: DB={settings.DATABASE_URL}")
print(f"DEBUG CORS: {settings.ALLOWED_ORIGINS}")
