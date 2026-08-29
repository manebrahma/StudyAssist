import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.database import get_db
from app.models.db_models import Quiz, QuizQuestion, QuizAttempt, StudySession
from app.models.schemas import (
    QuizGenerateRequest,
    QuizResponse,
    QuizSubmitRequest,
    QuizResultResponse,
)
from app.services.quiz_service import generate_quiz_questions

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizResponse, status_code=201)
async def generate(data: QuizGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate a quiz from text content using AI."""
    session = await db.get(StudySession, data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    text = data.text
    if not text and session.extracted_text:
        text = session.extracted_text
    if not text:
        raise HTTPException(status_code=400, detail="No text available to generate quiz from")

    try:
        questions_data = await generate_quiz_questions(text, data.question_type, data.count)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    if not questions_data:
        raise HTTPException(status_code=422, detail="Could not generate quiz questions from the provided text")

    # Create quiz
    quiz = Quiz(
        session_id=data.session_id,
        subject_id=session.subject_id,
        topic_id=session.topic_id,
    )
    db.add(quiz)
    await db.flush()  # get quiz.id

    # Create questions
    for qdata in questions_data:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=qdata["question"],
            options=qdata.get("options"),
            correct_answer=qdata["correct_answer"],
            explanation=qdata.get("explanation", ""),
            question_type=qdata.get("question_type", "mcq"),
        )
        db.add(question)

    await db.commit()

    # Reload with questions
    result = await db.execute(
        select(Quiz)
        .options(selectinload(Quiz.questions))
        .where(Quiz.id == quiz.id)
    )
    quiz = result.scalar_one()
    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: str,
    data: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit quiz answers and get scored results."""
    result = await db.execute(
        select(Quiz)
        .options(selectinload(Quiz.questions))
        .where(Quiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Build answer lookup
    answer_map = {a["question_id"]: a["answer"] for a in data.answers}

    # Score each question
    results = []
    correct_count = 0
    for q in quiz.questions:
        student_answer = answer_map.get(q.id, "")
        is_correct = student_answer.strip().lower() == q.correct_answer.strip().lower()
        if is_correct:
            correct_count += 1
        results.append({
            "question_id": q.id,
            "question": q.question,
            "student_answer": student_answer,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation or "",
        })

    total = len(quiz.questions)
    score = (correct_count / total * 100) if total > 0 else 0

    # Save attempt
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        answers=json.dumps(data.answers),
        score=score,
    )
    db.add(attempt)
    await db.commit()

    return QuizResultResponse(
        quiz_id=quiz_id,
        score=score,
        total_questions=total,
        correct_count=correct_count,
        results=results,
    )


@router.get("/history", response_model=list[QuizResponse])
async def quiz_history(
    session_id: str | None = Query(None),
    subject_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List past quizzes with optional filtering."""
    query = select(Quiz).options(selectinload(Quiz.questions)).order_by(Quiz.created_at.desc())
    if session_id:
        query = query.where(Quiz.session_id == session_id)
    if subject_id:
        query = query.where(Quiz.subject_id == subject_id)
    result = await db.execute(query)
    return result.scalars().all()
