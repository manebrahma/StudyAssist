from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    # App
    app_name: str = "StudyAssist"
    app_version: str = "0.1.0"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///./studyassist.db"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_text_model: str = "phi3"
    ollama_vision_model: str = "llava"
    ollama_timeout: int = 300  # seconds — phi3 on CPU can be slow

    # File uploads
    upload_dir: str = "uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB

    # CORS
    cors_origins: list[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
