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
    # SERVER
    PORT: int = 8000
    BASE_URL: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://stockbot-ao-production.up.railway.app"

    @property
    def ALLOWED_ORIGINS_LIST(self) -> List[str]:
        return parse_cors(self.ALLOWED_ORIGINS)

    # DATABASE
    DATABASE_URL: str = "postgresql+asyncpg://postgres:12345@localhost:5432/stockbot_db"

    # AUTH
    JWT_SECRET: str = "stockbot-dev-secret-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # TELEGRAM
    TELEGRAM_BOT_TOKEN: str | None = None

    # CLOUDINARY
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

settings = Settings()

print(f"DEBUG CONFIG LOADED: DB={settings.DATABASE_URL}")
print(f"DEBUG CORS: {settings.ALLOWED_ORIGINS_LIST}")
