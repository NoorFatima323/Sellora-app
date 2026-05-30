# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    JWT_SECRET: str
    WORDPRESS_URL: str | None = None
    WORDPRESS_API_KEY: str | None = None
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Allowed CORS origins
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "https://sellora.vercel.app",
        "http://127.0.0.1:5173"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
