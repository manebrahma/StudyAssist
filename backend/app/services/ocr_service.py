import httpx
import json
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OCRService:
    """Service for text extraction using Tesseract OCR (Docker API)."""

    def __init__(self):
        self.url = settings.tesseract_url
        self.timeout = settings.tesseract_timeout

    async def extract_text(self, image_bytes: bytes) -> str:
        """Extract text from an image via Tesseract Docker API."""
        try:
            files = {"file": ("image.png", image_bytes, "image/png")}
            data = {"options": json.dumps({"languages": ["eng"]})}

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.url, files=files, data=data)
                response.raise_for_status()

            result = response.json()
            text = result.get("data", {}).get("stdout", "")
            return text.strip()
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            raise

    async def is_available(self) -> bool:
        """Check if Tesseract Docker API is accessible."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(
                    self.url.rsplit("/", 1)[0] + "/"
                )
                return response.status_code == 200
        except Exception:
            return False


ocr_service = OCRService()
