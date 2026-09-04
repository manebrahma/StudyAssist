"""Integration test for PDF upload with mocked LLM generation."""
import json
import tempfile
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient
from reportlab.pdfgen.canvas import Canvas

from app.api.routes import documents
from app.main import app


def make_text_pdf() -> bytes:
    buffer = BytesIO()
    canvas = Canvas(buffer)
    lines = [
        "Cell biology chapter: mitochondria generate ATP through cellular respiration.",
        "Photosynthesis converts light energy into chemical energy in chloroplasts.",
        "DNA stores genetic information and directs protein synthesis.",
        "Cell membranes regulate movement of substances into and out of cells.",
    ]
    y_position = 740
    for line in lines:
        canvas.drawString(72, y_position, line)
        y_position -= 36
    canvas.save()
    return buffer.getvalue()


async def fake_flashcards(text: str, count: int) -> list[dict]:
    return [
        {"front": f"Question {index} from {text[:20]}", "back": f"Answer {index}"}
        for index in range(1, count + 1)
    ]


async def fake_quiz(text: str, question_type: str, count: int) -> list[dict]:
    return [
        {
            "question": f"Quiz question {index}",
            "options": json.dumps(["Answer", "Distractor 1", "Distractor 2", "Distractor 3"]),
            "correct_answer": "Answer",
            "explanation": "Answer is supported by the chapter text.",
            "question_type": "mcq",
        }
        for index in range(1, count + 1)
    ]


def main() -> None:
    original_directory = documents.settings.document_upload_dir
    original_flashcards = documents.generate_flashcards
    original_quiz = documents.generate_quiz_questions

    with tempfile.TemporaryDirectory() as temp_directory:
        documents.settings.document_upload_dir = temp_directory
        documents.generate_flashcards = fake_flashcards
        documents.generate_quiz_questions = fake_quiz

        try:
            with TestClient(app) as client:
                response = client.post(
                    "/api/documents/upload",
                    data={"title": "Cell Biology Chapter"},
                    files={"file": ("cell-biology.pdf", make_text_pdf(), "application/pdf")},
                )
                assert response.status_code == 201, response.text
                payload = response.json()

                assert payload["document"]["filename"] == "cell-biology.pdf"
                assert payload["document"]["page_count"] == 1
                assert payload["document"]["extracted_characters"] > 100
                assert len(payload["flashcards"]) == 10
                assert len(payload["quiz"]["questions"]) == 10

                session_id = payload["session"]["id"]
                session_response = client.get(f"/api/sessions/{session_id}")
                assert session_response.status_code == 200, session_response.text
                session = session_response.json()
                assert len(session["documents"]) == 1
                assert "mitochondria" in session["extracted_text"].lower()

                delete_response = client.delete(f"/api/sessions/{session_id}")
                assert delete_response.status_code == 204, delete_response.text

            assert not list(Path(temp_directory).iterdir())
            print("PDF upload integration test passed")
        finally:
            documents.settings.document_upload_dir = original_directory
            documents.generate_flashcards = original_flashcards
            documents.generate_quiz_questions = original_quiz


if __name__ == "__main__":
    main()
