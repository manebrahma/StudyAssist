from pydantic import BaseModel, Field
from datetime import datetime, date


# ──── Subject ────

class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#4A90D9", pattern=r"^#[0-9a-fA-F]{6}$")


class SubjectResponse(BaseModel):
    id: str
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──── Topic ────

class TopicCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class TopicResponse(BaseModel):
    id: str
    subject_id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──── Study Session ────

class SessionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    subject_id: str | None = None
    topic_id: str | None = None


class SessionResponse(BaseModel):
    id: str
    title: str
    subject_id: str | None
    topic_id: str | None
    extracted_text: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SessionDetailResponse(SessionResponse):
    images: list["ImageResponse"] = []
    messages: list["MessageResponse"] = []


# ──── Image ────

class ImageResponse(BaseModel):
    id: str
    session_id: str
    file_path: str
    extracted_text: str | None
    ocr_method: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ──── Message ────

class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ──── Explain / Summarize ────

class ExplainRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    level: str = Field(default="simple", pattern=r"^(simple|detailed|eli5)$")


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    length: str = Field(default="medium", pattern=r"^(short|medium|long)$")


class AIResponse(BaseModel):
    content: str
    model: str


# ──── Flashcard ────

class FlashcardGenerateRequest(BaseModel):
    session_id: str
    text: str = Field(..., min_length=1, max_length=10000)
    count: int = Field(default=5, ge=1, le=20)


class FlashcardResponse(BaseModel):
    id: str
    session_id: str
    front: str
    back: str
    easiness_factor: float
    interval: int
    repetitions: int
    next_review: date
    created_at: datetime
    last_reviewed: datetime | None

    model_config = {"from_attributes": True}


class FlashcardReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5)  # SM-2: 0=total blackout, 5=perfect


# ──── Quiz ────

class QuizGenerateRequest(BaseModel):
    session_id: str
    text: str = Field(..., min_length=1, max_length=10000)
    question_type: str = Field(default="mcq", pattern=r"^(mcq|true_false|short_answer|mixed)$")
    count: int = Field(default=5, ge=1, le=20)


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: str | None  # JSON string
    question_type: str
    # correct_answer intentionally excluded — sent only after submission

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: str
    session_id: str
    questions: list[QuizQuestionResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizSubmitRequest(BaseModel):
    answers: list[dict]  # [{ "question_id": "...", "answer": "..." }]


class QuizResultResponse(BaseModel):
    quiz_id: str
    score: float
    total_questions: int
    correct_count: int
    results: list[dict]  # Per-question result with correct answer + explanation


# ──── Health ────

class HealthResponse(BaseModel):
    status: str
    version: str
    ollama_status: str
    ocr_status: str
    database_status: str
