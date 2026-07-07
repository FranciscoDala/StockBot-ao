from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

def parse_cors(v: str) -> List[str]:
    if not v:
        return []
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
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000" # MUDOU: era List[str], agora é str
    BASE_URL: str = ""

    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)

settings = Settings()

# parse depois de carregar
settings.ALLOWED_ORIGINS = parse_cors(settings.ALLOWED_ORIGINS) # ADICIONEI ESSA LINHA

print(f"DEBUG CONFIG LOADED: DB={settings.DATABASE_URL}")
print(f"DEBUG CORS: {settings.ALLOWED_ORIGINS}")
