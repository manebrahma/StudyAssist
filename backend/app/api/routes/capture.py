from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from app.models.database import get_db
from app.models.db_models import StudySession, SessionImage
from app.models.schemas import ImageResponse
from app.services.ocr_service import ocr_service
from app.services.vision_service import vision_service
from app.utils.image_utils import validate_image, generate_filename, preprocess_image
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/capture", tags=["capture"])


@router.post("", response_model=ImageResponse, status_code=201)
async def capture_image(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # Verify session exists
    session = await db.get(StudySession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Read and validate image
    content = await file.read()
    try:
        validate_image(file.filename, content, settings.max_upload_size)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Preprocess image
    processed = preprocess_image(content)

    # Save to disk
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = generate_filename(file.filename)
    file_path = upload_dir / filename
    file_path.write_bytes(processed)

    # Extract text — try Tesseract first, fallback to LLaVA
    extracted_text = ""
    ocr_method = "tesseract"
    try:
        extracted_text = await ocr_service.extract_text(processed)
    except Exception:
        pass

    # If Tesseract got little/no text, try vision model
    if len(extracted_text.strip()) < 20:
        try:
            extracted_text = await vision_service.extract_text_from_image(processed)
            ocr_method = "llava"
        except Exception:
            pass  # Keep whatever Tesseract got

    # Save to database
    image = SessionImage(
        session_id=session_id,
        file_path=str(file_path),
        extracted_text=extracted_text,
        ocr_method=ocr_method,
    )
    db.add(image)

    # Update session's extracted text (append)
    if extracted_text:
        existing = session.extracted_text or ""
        session.extracted_text = f"{existing}\n\n{extracted_text}".strip()

    await db.commit()
    await db.refresh(image)
    return image
