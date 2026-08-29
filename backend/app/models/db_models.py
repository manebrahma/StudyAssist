import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, ForeignKey, Float, Integer, Date, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.database import Base


def generate_uuid() -> str:
    return uuid.uuid4().hex


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#4A90D9")  # hex color
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    topics: Mapped[list["Topic"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    sessions: Mapped[list["StudySession"]] = relationship(back_populates="subject")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    subject: Mapped["Subject"] = relationship(back_populates="topics")
    sessions: Mapped[list["StudySession"]] = relationship(back_populates="topic")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    subject_id: Mapped[str | None] = mapped_column(ForeignKey("subjects.id"), nullable=True)
    topic_id: Mapped[str | None] = mapped_column(ForeignKey("topics.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subject: Mapped["Subject | None"] = relationship(back_populates="sessions")
    topic: Mapped["Topic | None"] = relationship(back_populates="sessions")
    images: Mapped[list["SessionImage"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    messages: Mapped[list["Message"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    flashcards: Mapped[list["Flashcard"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class SessionImage(Base):
    __tablename__ = "session_images"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("study_sessions.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_method: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "tesseract" | "llava"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["StudySession"] = relationship(back_populates="images")


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("study_sessions.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(10), nullable=False)  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["StudySession"] = relationship(back_populates="messages")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("study_sessions.id"), nullable=False)
    subject_id: Mapped[str | None] = mapped_column(ForeignKey("subjects.id"), nullable=True)
    topic_id: Mapped[str | None] = mapped_column(ForeignKey("topics.id"), nullable=True)
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    # SM-2 spaced repetition fields
    easiness_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval: Mapped[int] = mapped_column(Integer, default=1)  # days
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    next_review: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_reviewed: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    session: Mapped["StudySession"] = relationship(back_populates="flashcards")


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("study_sessions.id"), nullable=False)
    subject_id: Mapped[str | None] = mapped_column(ForeignKey("subjects.id"), nullable=True)
    topic_id: Mapped[str | None] = mapped_column(ForeignKey("topics.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["StudySession"] = relationship(back_populates="quizzes")
    questions: Mapped[list["QuizQuestion"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    quiz_id: Mapped[str] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array string for MCQ
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    question_type: Mapped[str] = mapped_column(String(20), default="mcq")  # mcq | true_false | short_answer

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    quiz_id: Mapped[str] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    answers: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    score: Mapped[float] = mapped_column(Float, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    quiz: Mapped["Quiz"] = relationship(back_populates="attempts")


class StudyProgress(Base):
    __tablename__ = "study_progress"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=generate_uuid)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    subject_id: Mapped[str | None] = mapped_column(ForeignKey("subjects.id"), nullable=True)
    topic_id: Mapped[str | None] = mapped_column(ForeignKey("topics.id"), nullable=True)
    sessions_count: Mapped[int] = mapped_column(Integer, default=0)
    flashcards_reviewed: Mapped[int] = mapped_column(Integer, default=0)
    quiz_score_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, default=0)
