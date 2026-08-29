from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.db_models import Subject, Topic
from app.models.schemas import (
    SubjectCreate, SubjectResponse,
    TopicCreate, TopicResponse,
)

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectResponse])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).order_by(Subject.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=SubjectResponse, status_code=201)
async def create_subject(data: SubjectCreate, db: AsyncSession = Depends(get_db)):
    subject = Subject(name=data.name, color=data.color)
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(subject_id: str, db: AsyncSession = Depends(get_db)):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.delete("/{subject_id}", status_code=204)
async def delete_subject(subject_id: str, db: AsyncSession = Depends(get_db)):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    await db.delete(subject)
    await db.commit()


# ──── Topics under a Subject ────

@router.get("/{subject_id}/topics", response_model=list[TopicResponse])
async def list_topics(subject_id: str, db: AsyncSession = Depends(get_db)):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    result = await db.execute(
        select(Topic).where(Topic.subject_id == subject_id).order_by(Topic.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{subject_id}/topics", response_model=TopicResponse, status_code=201)
async def create_topic(subject_id: str, data: TopicCreate, db: AsyncSession = Depends(get_db)):
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    topic = Topic(name=data.name, subject_id=subject_id)
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


@router.delete("/{subject_id}/topics/{topic_id}", status_code=204)
async def delete_topic(subject_id: str, topic_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Topic).where(Topic.id == topic_id, Topic.subject_id == subject_id)
    )
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    await db.delete(topic)
    await db.commit()
