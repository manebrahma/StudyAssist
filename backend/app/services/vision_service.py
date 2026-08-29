import httpx
import base64
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class VisionService:
    """Service for image understanding using Ollama LLaVA model."""

    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.vision_model = settings.ollama_vision_model
        self.timeout = settings.ollama_timeout

    async def analyze_image(self, image_bytes: bytes, prompt: str = "Describe this image in detail.") -> str:
        """Analyze an image using the vision model."""
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        payload = {
            "model": self.vision_model,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def extract_text_from_image(self, image_bytes: bytes) -> str:
        """Extract text content from an image using the vision model."""
        prompt = (
            "Extract all text from this image. "
            "If the text is handwritten, do your best to read it accurately. "
            "Return only the extracted text, preserving the original formatting where possible. "
            "If there are diagrams or figures, briefly describe them."
        )
        return await self.analyze_image(image_bytes, prompt)

    async def is_available(self) -> bool:
        """Check if the vision model is available in Ollama."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "").split(":")[0] for m in models]
                    return self.vision_model in model_names
                return False
        except Exception:
            return False


vision_service = VisionService()
