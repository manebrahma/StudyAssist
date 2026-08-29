import httpx
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMService:
    """Service for interacting with Ollama LLM models."""

    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.text_model = settings.ollama_text_model
        self.timeout = settings.ollama_timeout

    async def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        """Generate text using the Ollama text model."""
        payload = {
            "model": self.text_model,
            "prompt": prompt,
            "stream": False,
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    async def chat(self, messages: list[dict], system_prompt: str | None = None) -> str:
        """Chat-style generation with message history."""
        chat_messages = []
        if system_prompt:
            chat_messages.append({"role": "system", "content": system_prompt})
        chat_messages.extend(messages)

        payload = {
            "model": self.text_model,
            "messages": chat_messages,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")

    async def explain(self, text: str, level: str = "simple") -> str:
        """Explain content at the specified level."""
        level_prompts = {
            "simple": "Explain this in simple terms that a student can easily understand. Use examples where helpful.",
            "detailed": "Provide a detailed, thorough explanation of this content. Include key concepts, relationships, and implications.",
            "eli5": "Explain this like I'm 5 years old. Use very simple language, analogies, and fun examples.",
        }
        system = level_prompts.get(level, level_prompts["simple"])
        return await self.generate(prompt=text, system_prompt=system)

    async def summarize(self, text: str, length: str = "medium") -> str:
        """Summarize content to the specified length."""
        length_prompts = {
            "short": "Summarize this in 2-3 sentences. Only the key points.",
            "medium": "Provide a concise summary covering all main points in a few paragraphs.",
            "long": "Provide a comprehensive summary preserving important details and structure.",
        }
        system = length_prompts.get(length, length_prompts["medium"])
        return await self.generate(prompt=text, system_prompt=system)

    async def is_available(self) -> bool:
        """Check if Ollama is running and the model is available."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "").split(":")[0] for m in models]
                    return self.text_model in model_names
                return False
        except Exception:
            return False


llm_service = LLMService()
