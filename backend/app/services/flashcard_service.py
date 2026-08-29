"""Service for AI-powered flashcard generation."""

import json
import logging

from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

FLASHCARD_SYSTEM_PROMPT = """You are a flashcard generator for students. Given study material, generate high-quality flashcards.

RULES:
- Each flashcard has a "front" (question/term) and "back" (answer/definition)
- Questions should test understanding, not just rote memorization
- Include a mix of: definitions, concepts, relationships, and application questions
- Keep answers concise but complete
- Front should be a clear, specific question
- Back should be a direct, accurate answer

You MUST respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Example format:
[{"front": "What is photosynthesis?", "back": "The process by which plants convert sunlight, water, and CO2 into glucose and oxygen using chlorophyll."}]"""


async def generate_flashcards(text: str, count: int = 5) -> list[dict]:
    """
    Generate flashcards from study material text.

    Args:
        text: The study material to generate flashcards from
        count: Number of flashcards to generate (1-20)

    Returns:
        List of dicts with "front" and "back" keys
    """
    prompt = f"Generate exactly {count} flashcards from the following study material:\n\n{text}"

    try:
        response = await llm_service.generate(prompt=prompt, system_prompt=FLASHCARD_SYSTEM_PROMPT)

        # Try to extract JSON from the response
        cards = _parse_flashcard_response(response)

        if not cards:
            logger.warning("Failed to parse flashcard response, using fallback")
            return _fallback_flashcards(text, count)

        return cards[:count]

    except Exception as e:
        logger.error(f"Flashcard generation failed: {e}")
        raise


def _parse_flashcard_response(response: str) -> list[dict]:
    """Parse the LLM response into a list of flashcard dicts."""
    # Strip any markdown code fences
    text = response.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    # Find JSON array in the response
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        return []

    json_str = text[start:end + 1]

    try:
        cards = json.loads(json_str)
    except json.JSONDecodeError:
        return []

    # Validate structure
    valid_cards = []
    for card in cards:
        if isinstance(card, dict) and "front" in card and "back" in card:
            valid_cards.append({
                "front": str(card["front"]).strip(),
                "back": str(card["back"]).strip(),
            })

    return valid_cards


def _fallback_flashcards(text: str, count: int) -> list[dict]:
    """Generate simple fallback flashcards if AI parsing fails."""
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 20]
    cards = []
    for i, sentence in enumerate(sentences[:count]):
        cards.append({
            "front": f"Explain: {sentence[:80]}...",
            "back": sentence,
        })
    return cards if cards else [{"front": "Review this material", "back": text[:200]}]
