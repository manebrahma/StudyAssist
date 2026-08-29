from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.database import get_db
from app.models.db_models import StudySession
from app.models.schemas import SessionCreate, SessionResponse, SessionDetailResponse

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    subject_id: str | None = Query(None),
    topic_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(StudySession).order_by(StudySession.updated_at.desc())
    if subject_id:
        query = query.where(StudySession.subject_id == subject_id)
    if topic_id:
        query = query.where(StudySession.topic_id == topic_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = StudySession(
        title=data.title,
        subject_id=data.subject_id,
        topic_id=data.topic_id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StudySession)
        .options(selectinload(StudySession.images), selectinload(StudySession.messages))
        .where(StudySession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(StudySession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
