from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # App
    app_name: str = "StudyAssist"
    app_version: str = "0.1.0"
    debug: bool = True

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = f"sqlite+aiosqlite:///{(BACKEND_DIR / 'studyassist.db').as_posix()}"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_text_model: str = "llama3.2:3b"
    ollama_vision_model: str = "llava"
    ollama_timeout: int = 300  # seconds — local CPU inference can be slow

    # Tesseract OCR (Docker: hertzg/tesseract-server)
    tesseract_url: str = "http://localhost:8080/tesseract"
    tesseract_timeout: int = 30  # seconds

    # File uploads
    upload_dir: str = str(BACKEND_DIR / "uploads")
    max_upload_size: int = 10 * 1024 * 1024  # 10MB

    # Chapter PDF uploads
    document_upload_dir: str = str(BACKEND_DIR / "uploads" / "documents")
    max_pdf_upload_size: int = 25 * 1024 * 1024  # 25MB
    max_pdf_pages: int = 100
    pdf_generation_chunk_size: int = 9000

    # CORS
    cors_origins: list[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
