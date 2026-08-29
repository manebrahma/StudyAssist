import pytesseract
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)


class OCRService:
    """Service for text extraction using Tesseract OCR."""

    async def extract_text(self, image_bytes: bytes) -> str:
        """Extract text from an image using Tesseract OCR."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            raise

    async def is_available(self) -> bool:
        """Check if Tesseract is installed and accessible."""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False


ocr_service = OCRService()
