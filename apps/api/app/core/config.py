from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    ALLOWED_ORIGINS: list[str] = ["*"]
    JWT_SECRET: str # <-- ESSA CHAVE O security.py VAI USAR

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()