from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db
from app.models.db_models import StudySession, Message
from app.models.schemas import ChatRequest, MessageResponse, ExplainRequest, SummarizeRequest, AIResponse
from app.services.llm_service import llm_service

router = APIRouter(prefix="/api", tags=["chat"])


STUDY_ASSISTANT_SYSTEM = (
    "You are StudyAssist, a helpful AI study companion. "
    "You help students understand their study material by explaining concepts clearly, "
    "answering questions, and providing examples. "
    "Be encouraging, patient, and use simple language. "
    "When relevant, use bullet points, numbered lists, and structured formatting."
)


@router.post("/chat", response_model=MessageResponse)
async def chat(data: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    session = await db.get(StudySession, data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get conversation history
    result = await db.execute(
        select(Message)
        .where(Message.session_id == data.session_id)
        .order_by(Message.created_at)
    )
    history = result.scalars().all()

    # Build messages for LLM
    messages = [{"role": m.role, "content": m.content} for m in history]

    # Add context from extracted text if available
    context_prompt = STUDY_ASSISTANT_SYSTEM
    if session.extracted_text:
        context_prompt += (
            f"\n\nThe student is studying the following material:\n"
            f"---\n{session.extracted_text[:3000]}\n---\n"
            "Use this material as context when answering questions."
        )

    # Add new user message
    messages.append({"role": "user", "content": data.message})

    # Save user message
    user_msg = Message(session_id=data.session_id, role="user", content=data.message)
    db.add(user_msg)

    # Generate AI response
    try:
        ai_response = await llm_service.chat(messages, system_prompt=context_prompt)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    # Save assistant message
    assistant_msg = Message(session_id=data.session_id, role="assistant", content=ai_response)
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    return assistant_msg


@router.post("/explain", response_model=AIResponse)
async def explain(data: ExplainRequest):
    try:
        content = await llm_service.explain(data.text, data.level)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    return AIResponse(content=content, model=llm_service.text_model)


@router.post("/summarize", response_model=AIResponse)
async def summarize(data: SummarizeRequest):
    try:
        content = await llm_service.summarize(data.text, data.length)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
    return AIResponse(content=content, model=llm_service.text_model)
