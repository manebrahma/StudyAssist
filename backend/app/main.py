import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models.database import init_db
from app.models.schemas import HealthResponse
from app.services.llm_service import llm_service
from app.services.ocr_service import ocr_service
from app.api.routes import subjects, sessions, capture, chat, flashcards, quiz, documents

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    await init_db()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info("Database initialized")

    ollama_ok = await llm_service.is_available()
    if ollama_ok:
        logger.info(f"Ollama connected — model: {settings.ollama_text_model}")
    else:
        logger.warning("Ollama not available — AI features will fail until Ollama is running")

    yield

    # Shutdown
    logger.info("Shutting down")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(subjects.router)
app.include_router(sessions.router)
app.include_router(capture.router)
app.include_router(chat.router)
app.include_router(flashcards.router)
app.include_router(quiz.router)
app.include_router(documents.router)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    ollama_ok = await llm_service.is_available()
    ocr_ok = await ocr_service.is_available()
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        ollama_status="connected" if ollama_ok else "unavailable",
        ocr_status="connected" if ocr_ok else "unavailable",
        database_status="connected",  # If we got here, DB is fine
    )
