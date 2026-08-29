# StudyAssist

> A study companion that turns your textbooks into flashcards, quizzes, and a personal knowledge base — all from a photo, all offline, all free.

## Quick Start

### Prerequisites
- Python 3.10+
- [Ollama](https://ollama.ai) installed and running
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed

### Setup

```bash
# Pull AI models
ollama pull llama3.1
ollama pull llava

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux/Mac
pip install -r requirements.txt

# Copy environment config
copy .env.example .env     # Windows
# cp .env.example .env     # Linux/Mac

# Run the server
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

## Project Structure

```
StudyAssist/
├── backend/          # Python FastAPI server
│   ├── app/
│   │   ├── api/routes/   # API endpoints
│   │   ├── models/       # Database & Pydantic models
│   │   ├── services/     # AI, OCR, business logic
│   │   └── utils/        # Helpers
│   └── requirements.txt
├── mobile/           # React Native app (coming soon)
└── docs/PLAN.md      # Full project plan
```

## Features

- 📸 **Camera Capture** — Snap photos of textbooks, notes, whiteboards
- 🔍 **Smart OCR** — Tesseract for printed text, LLaVA for handwriting
- 💡 **AI Explanations** — Get concepts explained at your level
- 💬 **Q&A Chat** — Ask follow-up questions about your material
- 📝 **One-Tap Flashcards** — Auto-generate flashcards from any page
- ❓ **One-Tap Quizzes** — Auto-generate practice tests
- 📊 **Progress Tracking** — Track what you've studied and where to improve
- 🔒 **100% Private** — All AI runs locally, no data leaves your device
- 💰 **100% Free** — No subscriptions, no API costs

## License

MIT
