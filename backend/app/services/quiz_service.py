"""Service for AI-powered quiz generation."""

import json
import logging

from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

QUIZ_SYSTEM_PROMPTS = {
    "mcq": """You are a quiz generator. Generate multiple-choice questions from study material.

RULES:
- Each question has: "question", "options" (array of 4 choices), "correct_answer" (the correct option text), "explanation"
- Options should be plausible — avoid obviously wrong answers
- Include exactly 4 options per question
- Explanation should briefly explain WHY the answer is correct

You MUST respond with ONLY a valid JSON array. No markdown, no code fences.
Example: [{"question": "What organelle is the powerhouse of the cell?", "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], "correct_answer": "Mitochondria", "explanation": "Mitochondria produce ATP through cellular respiration."}]""",

    "true_false": """You are a quiz generator. Generate true/false questions from study material.

RULES:
- Each question has: "question" (a statement), "options" (always ["True", "False"]), "correct_answer" ("True" or "False"), "explanation"
- Mix true and false answers roughly equally
- Statements should test understanding, not trick the student

You MUST respond with ONLY a valid JSON array. No markdown, no code fences.
Example: [{"question": "Photosynthesis occurs in the mitochondria.", "options": ["True", "False"], "correct_answer": "False", "explanation": "Photosynthesis occurs in chloroplasts, not mitochondria."}]""",

    "short_answer": """You are a quiz generator. Generate short-answer questions from study material.

RULES:
- Each question has: "question", "options" (null for short answer), "correct_answer", "explanation"
- Questions should have brief, specific answers (1-2 sentences)
- Avoid overly broad questions

You MUST respond with ONLY a valid JSON array. No markdown, no code fences.
Example: [{"question": "What is the primary function of ribosomes?", "options": null, "correct_answer": "Protein synthesis", "explanation": "Ribosomes translate mRNA into proteins."}]""",
}


async def generate_quiz_questions(text: str, question_type: str = "mcq", count: int = 5) -> list[dict]:
    """
    Generate quiz questions from study material.

    Args:
        text: Study material to generate questions from
        question_type: "mcq", "true_false", "short_answer", or "mixed"
        count: Number of questions to generate

    Returns:
        List of question dicts with question, options, correct_answer, explanation, question_type
    """
    if question_type == "mixed":
        return await _generate_mixed(text, count)

    system_prompt = QUIZ_SYSTEM_PROMPTS.get(question_type, QUIZ_SYSTEM_PROMPTS["mcq"])
    prompt = f"Generate exactly {count} {question_type.replace('_', ' ')} questions from this material:\n\n{text}"

    try:
        response = await llm_service.generate(prompt=prompt, system_prompt=system_prompt)
        questions = _parse_quiz_response(response, question_type)

        if not questions:
            logger.warning("Failed to parse quiz response, using fallback")
            return _fallback_questions(text, question_type, count)

        return questions[:count]

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise


async def _generate_mixed(text: str, count: int) -> list[dict]:
    """Generate a mix of question types."""
    mcq_count = max(1, count // 2)
    tf_count = max(1, (count - mcq_count) // 2)
    sa_count = max(1, count - mcq_count - tf_count)

    questions = []
    for qtype, qcount in [("mcq", mcq_count), ("true_false", tf_count), ("short_answer", sa_count)]:
        try:
            qs = await generate_quiz_questions(text, qtype, qcount)
            questions.extend(qs)
        except Exception:
            pass

    return questions[:count]


def _parse_quiz_response(response: str, question_type: str) -> list[dict]:
    """Parse the LLM response into quiz question dicts."""
    text = response.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        return []

    json_str = text[start:end + 1]

    try:
        questions = json.loads(json_str)
    except json.JSONDecodeError:
        return []

    valid = []
    for q in questions:
        if not isinstance(q, dict) or "question" not in q or "correct_answer" not in q:
            continue

        options = q.get("options")
        if isinstance(options, list):
            options = json.dumps(options)

        valid.append({
            "question": str(q["question"]).strip(),
            "options": options,
            "correct_answer": str(q["correct_answer"]).strip(),
            "explanation": str(q.get("explanation", "")).strip(),
            "question_type": question_type,
        })

    return valid


def _fallback_questions(text: str, question_type: str, count: int) -> list[dict]:
    """Generate simple fallback questions if AI parsing fails."""
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 20]
    questions = []
    for sentence in sentences[:count]:
        questions.append({
            "question": f"What does the following describe: '{sentence[:80]}...'?",
            "options": json.dumps(["True", "False"]) if question_type == "true_false" else None,
            "correct_answer": sentence[:100],
            "explanation": "Review the study material for this topic.",
            "question_type": question_type,
        })
    return questions
