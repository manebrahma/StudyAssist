from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.db_models import Flashcard, StudySession
from app.models.schemas import (
    FlashcardGenerateRequest,
    FlashcardResponse,
    FlashcardReviewRequest,
)
from app.services.flashcard_service import generate_flashcards
from app.utils.spaced_repetition import sm2

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


@router.post("/generate", response_model=list[FlashcardResponse], status_code=201)
async def generate(data: FlashcardGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate flashcards from text content using AI."""
    # Verify session exists
    session = await db.get(StudySession, data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Use session extracted text if no text provided
    text = data.text
    if not text and session.extracted_text:
        text = session.extracted_text
    if not text:
        raise HTTPException(status_code=400, detail="No text available to generate flashcards from")

    try:
        cards_data = await generate_flashcards(text, data.count)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    # Save flashcards to DB
    flashcards = []
    for card in cards_data:
        fc = Flashcard(
            session_id=data.session_id,
            subject_id=session.subject_id,
            topic_id=session.topic_id,
            front=card["front"],
            back=card["back"],
        )
        db.add(fc)
        flashcards.append(fc)

    await db.commit()
    for fc in flashcards:
        await db.refresh(fc)

    return flashcards


@router.get("", response_model=list[FlashcardResponse])
async def list_flashcards(
    session_id: str | None = Query(None),
    subject_id: str | None = Query(None),
    topic_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List flashcards with optional filtering."""
    query = select(Flashcard).order_by(Flashcard.created_at.desc())
    if session_id:
        query = query.where(Flashcard.session_id == session_id)
    if subject_id:
        query = query.where(Flashcard.subject_id == subject_id)
    if topic_id:
        query = query.where(Flashcard.topic_id == topic_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/review", response_model=list[FlashcardResponse])
async def get_review_queue(db: AsyncSession = Depends(get_db)):
    """Get flashcards due for review today (spaced repetition queue)."""
    today = date.today()
    result = await db.execute(
        select(Flashcard)
        .where(Flashcard.next_review <= today)
        .order_by(Flashcard.next_review)
    )
    return result.scalars().all()


@router.put("/{flashcard_id}/review", response_model=FlashcardResponse)
async def review_flashcard(
    flashcard_id: str,
    data: FlashcardReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit a flashcard review result, updating SM-2 scheduling."""
    fc = await db.get(Flashcard, flashcard_id)
    if not fc:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    # Apply SM-2 algorithm
    new_reps, new_interval, new_ef, next_review = sm2(
        quality=data.quality,
        repetitions=fc.repetitions,
        interval=fc.interval,
        easiness_factor=fc.easiness_factor,
    )

    fc.repetitions = new_reps
    fc.interval = new_interval
    fc.easiness_factor = new_ef
    fc.next_review = next_review
    fc.last_reviewed = datetime.utcnow()

    await db.commit()
    await db.refresh(fc)
    return fc


@router.delete("/{flashcard_id}", status_code=204)
async def delete_flashcard(flashcard_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a flashcard."""
    fc = await db.get(Flashcard, flashcard_id)
    if not fc:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    await db.delete(fc)
    await db.commit()
