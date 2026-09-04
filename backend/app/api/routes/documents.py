"""Chapter PDF upload and automatic study-set generation."""

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.database import get_db
from app.models.db_models import Flashcard, Quiz, QuizQuestion, SessionDocument, StudySession
from app.models.schemas import PdfUploadResponse
from app.services.flashcard_service import generate_flashcards
from app.services.pdf_service import PdfExtractionError, extract_pdf_text, generation_chunks
from app.services.quiz_service import generate_quiz_questions
from app.utils.image_utils import generate_filename

settings = get_settings()
router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=PdfUploadResponse, status_code=201)
async def upload_chapter_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject_id: str | None = Form(None),
    topic_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Store a text PDF chapter and automatically generate its study materials."""
    filename = file.filename or "chapter.pdf"
    if Path(filename).suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    if not title.strip():
        raise HTTPException(status_code=400, detail="A chapter title is required.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
    if len(content) > settings.max_pdf_upload_size:
        raise HTTPException(status_code=400, detail="The PDF exceeds the 25 MB upload limit.")

    try:
        extracted_text, page_count = extract_pdf_text(content, settings.max_pdf_pages)
    except PdfExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    saved_path: Path | None = None
    try:
        upload_dir = Path(settings.document_upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        saved_path = upload_dir / generate_filename(filename)
        saved_path.write_bytes(content)

        session = StudySession(
            title=title.strip(),
            subject_id=subject_id,
            topic_id=topic_id,
            extracted_text=extracted_text,
        )
        db.add(session)
        await db.flush()

        document = SessionDocument(
            session_id=session.id,
            filename=filename,
            file_path=str(saved_path),
            page_count=page_count,
            extracted_characters=len(extracted_text),
        )
        db.add(document)

        chunks = generation_chunks(extracted_text, settings.pdf_generation_chunk_size)
        cards_data = []
        cards_per_chunk = -(-10 // len(chunks))
        for chunk in chunks:
            cards_data.extend(await generate_flashcards(chunk, cards_per_chunk))
        cards_data = _unique_by_key(cards_data, "front")[:10]

        questions_data = await generate_quiz_questions(chunks[0], "mixed", 10)
        questions_data = _unique_by_key(questions_data, "question")[:10]
        if not cards_data or not questions_data:
            raise ValueError("The AI did not return enough study material.")

        flashcards = []
        for card in cards_data:
            flashcard = Flashcard(
                session_id=session.id,
                subject_id=session.subject_id,
                topic_id=session.topic_id,
                front=card["front"],
                back=card["back"],
            )
            db.add(flashcard)
            flashcards.append(flashcard)

        quiz = Quiz(session_id=session.id, subject_id=session.subject_id, topic_id=session.topic_id)
        db.add(quiz)
        await db.flush()
        for question_data in questions_data:
            db.add(QuizQuestion(quiz_id=quiz.id, **question_data))

        await db.commit()
        for flashcard in flashcards:
            await db.refresh(flashcard)
        await db.refresh(session)
        await db.refresh(document)
        result = await db.execute(
            select(Quiz).options(selectinload(Quiz.questions)).where(Quiz.id == quiz.id)
        )
        quiz = result.scalar_one()
        return {"session": session, "document": document, "flashcards": flashcards, "quiz": quiz}
    except Exception as error:
        await db.rollback()
        if saved_path and saved_path.exists():
            saved_path.unlink()
        raise HTTPException(status_code=503, detail=f"Could not generate study material: {error}") from error


def _unique_by_key(items: list[dict], key: str) -> list[dict]:
    seen = set()
    unique_items = []
    for item in items:
        value = str(item.get(key, "")).strip().lower()
        if value and value not in seen:
            seen.add(value)
            unique_items.append(item)
    return unique_items