# AI Study Assistant — Project Plan

## 1. Vision

> **A study companion that turns your textbooks into flashcards, quizzes, and a personal knowledge base — all from a photo, all offline, all free.**

An AI-powered mobile app where students **capture study material via camera** (textbook pages, handwritten notes, diagrams, equations) and the app **automatically builds a structured learning system** — flashcards with spaced repetition, auto-generated quizzes, progress tracking, and an organized knowledge base that grows with the student. All powered by locally-hosted open-source AI models — **zero cost, full privacy, no internet required**.

### How This Differs from ChatGPT / Claude

ChatGPT and Claude are general-purpose chat tools. Students can upload photos and ask questions, but they offer **no structured study workflow**. Our app is purpose-built for learning:

| Capability                            | ChatGPT / Claude         | StudyAssist                         |
| ------------------------------------- | ------------------------ | ----------------------------------- |
| Snap photo → get explanation          | ✅ (manual prompting)    | ✅ (one tap)                        |
| Auto-generate flashcards from photo   | ❌ Requires manual prompt| ✅ One tap, saved & organized       |
| Auto-generate quizzes from photo      | ❌ Requires manual prompt| ✅ One tap, scored & tracked        |
| Spaced repetition scheduling          | ❌                       | ✅ Built-in review reminders        |
| Track topics studied over time        | ❌                       | ✅ Study analytics dashboard        |
| Identify weak areas & suggest reviews | ❌                       | ✅ AI-powered gap detection         |
| Organized study sessions by subject   | ❌ Flat chat history     | ✅ Subjects → Topics → Sessions    |
| Cumulative knowledge base             | ❌ Conversations isolated| ✅ AI connects concepts across sessions |
| Cross-reference across chapters       | ❌                       | ✅ "Show everything about topic X"  |
| Cost                                  | $20/month (Pro)          | Free (Ollama runs locally)          |
| Data privacy                          | Sent to cloud servers    | 100% local, nothing leaves device   |
| Internet required                     | Always                   | No (after model download)           |
| Rate limits                           | Yes                      | No                                  |

### Core Value Proposition
1. **Not a chat tool** — a structured study system with one-tap workflows
2. **Cumulative learning** — builds a knowledge base that grows across sessions
3. **Active recall** — flashcards + quizzes + spaced repetition (proven study techniques)
4. **Free & private** — no subscription, no data leaves the device
5. **Smart tracking** — knows what you've studied and what needs review

---

## 2. Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Mobile App**     | React Native + Expo                             |
| **Camera**         | expo-camera                                     |
| **Backend**        | Python FastAPI                                  |
| **OCR (Primary)**  | Tesseract OCR (fast, printed text)              |
| **OCR (Fallback)** | LLaVA vision model (handwriting, diagrams)      |
| **LLM (Text)**     | Ollama — LLaMA 3.1 (8B)                        |
| **LLM (Vision)**   | Ollama — LLaVA (7B/13B)                        |
| **Database**       | SQLite (dev) → PostgreSQL (prod)                |
| **Image Storage**  | Local filesystem (dev) → S3-compatible (prod)   |

---

## 3. Architecture

```
┌─────────────────────────────────────┐
│         Mobile App (React Native)   │
│  ┌──────────┐  ┌──────────────────┐ │
│  │  Camera   │  │   Chat / Q&A     │ │
│  │  Capture  │  │   Interface      │ │
│  └─────┬─────┘  └────────┬─────────┘ │
│        │                 │           │
│        └────────┬────────┘           │
│                 │ HTTP/REST          │
└─────────────────┼────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        Backend (FastAPI)            │
│  ┌────────────────────────────────┐ │
│  │         API Gateway            │ │
│  │  /capture  /chat  /sessions    │ │
│  │  /flashcards  /quiz  /voice    │ │
│  └─────────────┬──────────────────┘ │
│                │                    │
│  ┌─────────────┼──────────────────┐ │
│  │             │                  │ │
│  ▼             ▼             ▼    │ │
│ OCR          LLM           Vision │ │
│ Service      Service       Service│ │
│ (Tesseract)  (LLaMA)      (LLaVA)│ │
│  │             │             │    │ │
│  └─────────────┼─────────────┘    │ │
│                │                  │ │
│                ▼                  │ │
│          Session Manager          │ │
│          (SQLite/PostgreSQL)      │ │
│                                   │ │
└───────────────────────────────────┘ │
                  │                    │
                  ▼                    │
┌─────────────────────────────────────┐
│        Ollama (Local AI)            │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ LLaMA 3.1│  │     LLaVA        │ │
│  │  (Text)  │  │    (Vision)      │ │
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

---

## 4. Features & Phases

### Phase 1 — MVP (The Differentiators)
> These features are what make StudyAssist worth using over ChatGPT/Claude.

| #  | Feature                          | Description                                                          | Priority    |
| -- | -------------------------------- | -------------------------------------------------------------------- | ----------- |
| F1 | **Camera Capture**               | Capture images of textbook pages, notes, whiteboards, equations      | Must-have   |
| F2 | **Text Extraction**              | OCR via Tesseract (printed) + LLaVA (handwritten/diagrams)           | Must-have   |
| F3 | **Concept Explanation**          | AI explains extracted content in simple, student-friendly terms      | Must-have   |
| F4 | **Q&A Chat**                     | Ask follow-up questions about captured material                      | Must-have   |
| F5 | **One-Tap Flashcard Generation** | Auto-generate flashcards from captured material — one button         | Must-have ★ |
| F6 | **One-Tap Quiz Generation**      | Generate MCQs, true/false, short-answer — one button                 | Must-have ★ |
| F7 | **Organized Study Sessions**     | Sessions organized by subject → topic, not flat chat history         | Must-have ★ |
| F8 | **Session History & Search**     | Save, revisit, and search past study sessions                        | Must-have   |
| F9 | **Summary Generation**           | Generate concise summaries of captured pages/notes                   | Must-have   |

### Phase 2 — Learning System (The Moat)
> These features create long-term retention and make the app indispensable.

| #   | Feature                          | Description                                                          | Priority    |
| --- | -------------------------------- | -------------------------------------------------------------------- | ----------- |
| F10 | **Spaced Repetition**            | Schedule flashcard reviews using SM-2 algorithm, push notifications  | Must-have ★ |
| F11 | **Progress Tracking Dashboard**  | Visual dashboard: topics studied, time spent, mastery levels         | Must-have ★ |
| F12 | **Weak Area Detection**          | AI identifies poorly-scored quiz topics and suggests review          | Must-have ★ |
| F13 | **Cumulative Knowledge Base**    | AI connects concepts across sessions; "show me everything about X"  | Must-have ★ |
| F14 | **Math/Equation Solving**        | Recognize and solve math equations, show step-by-step solutions      | High        |
| F15 | **Voice Interaction**            | Ask questions via voice input, receive spoken answers (TTS/STT)      | High        |

### Phase 3 — Growth & Polish

| #   | Feature                          | Description                                                  |
| --- | -------------------------------- | ------------------------------------------------------------ |
| F16 | **Cross-Topic Concept Linking**  | Auto-link related concepts across subjects and chapters      |
| F17 | **Study Analytics & Insights**   | Weekly study reports, streaks, optimal study time suggestions |
| F18 | **Pomodoro Timer Integration**   | Built-in study timer with session tracking                   |
| F19 | **Export to Anki / Quizlet**     | Export flashcard decks to popular platforms                   |
| F20 | **PDF / Document Upload**        | Upload full PDFs for batch processing                        |
| F21 | **Multi-language Support**       | Process materials in multiple languages                      |

### Phase 4 — Social & Scale

| #   | Feature                          | Description                                                  |
| --- | -------------------------------- | ------------------------------------------------------------ |
| F22 | **Collaborative Study Groups**   | Share flashcards/quizzes with peers                          |
| F23 | **Teacher/Parent Reports**       | Progress reports for parents or teachers                     |
| F24 | **Curriculum-Aligned Tagging**   | Tag content to specific curriculum standards                 |
| F25 | **Offline On-Device AI**         | Run AI models directly on mobile device                      |
| F26 | **Diagram Deep Understanding**   | Advanced analysis of charts, graphs, scientific diagrams     |

---

## 5. Project Structure

```
StudyAssist/
├── backend/                      # Python FastAPI server
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── config.py             # Configuration & environment
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── capture.py    # POST /capture — image upload & OCR
│   │   │       ├── chat.py       # POST /chat — Q&A conversations
│   │   │       ├── sessions.py   # GET/POST /sessions — study history
│   │   │       ├── subjects.py   # GET/POST /subjects — subject management
│   │   │       ├── flashcards.py # POST /flashcards — generate & manage cards
│   │   │       ├── quiz.py       # POST /quiz — generate & take quizzes
│   │   │       ├── progress.py   # GET /progress — dashboard & analytics
│   │   │       ├── knowledge.py  # GET /knowledge — knowledge base search
│   │   │       ├── math.py       # POST /math — equation solving
│   │   │       └── voice.py      # POST /voice — speech interaction
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ocr_service.py        # Tesseract OCR integration
│   │   │   ├── llm_service.py        # Ollama LLaMA text generation
│   │   │   ├── vision_service.py     # Ollama LLaVA image understanding
│   │   │   ├── flashcard_service.py  # Flashcard generation & spaced repetition
│   │   │   ├── quiz_service.py       # Quiz generation & scoring
│   │   │   ├── knowledge_service.py  # Knowledge base & concept linking
│   │   │   ├── progress_service.py   # Progress tracking & weak areas
│   │   │   ├── math_service.py       # Math/equation solving
│   │   │   └── voice_service.py      # STT/TTS integration
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── database.py       # DB connection & session
│   │   │   ├── schemas.py        # Pydantic request/response models
│   │   │   └── db_models.py      # SQLAlchemy ORM models
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── image_utils.py    # Image preprocessing helpers
│   │       └── spaced_repetition.py  # SM-2 algorithm implementation
│   ├── tests/
│   │   ├── test_capture.py
│   │   ├── test_chat.py
│   │   ├── test_flashcards.py
│   │   ├── test_quiz.py
│   │   └── test_services.py
│   ├── uploads/                  # Uploaded images (gitignored)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── mobile/                       # React Native (Expo) app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx        # Dashboard with study stats
│   │   │   ├── CameraScreen.tsx      # Camera capture
│   │   │   ├── PreviewScreen.tsx     # Image preview → one-tap actions
│   │   │   ├── ResultScreen.tsx      # Explanation + flashcard + quiz all at once
│   │   │   ├── ChatScreen.tsx        # Chat / Q&A interface
│   │   │   ├── HistoryScreen.tsx     # Past study sessions by subject
│   │   │   ├── SubjectsScreen.tsx    # Subject & topic management
│   │   │   ├── FlashcardScreen.tsx   # Flashcard viewer + spaced repetition
│   │   │   ├── FlashcardReviewScreen.tsx  # Daily review queue
│   │   │   ├── QuizScreen.tsx        # Quiz / practice test
│   │   │   ├── QuizResultScreen.tsx  # Quiz score & review answers
│   │   │   ├── ProgressScreen.tsx    # Study analytics dashboard
│   │   │   └── KnowledgeScreen.tsx   # Search cumulative knowledge base
│   │   ├── components/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── FlashCard.tsx         # Flip-able flashcard component
│   │   │   ├── QuizQuestion.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── ProgressChart.tsx     # Study progress charts
│   │   │   ├── SubjectTag.tsx        # Subject/topic tag pills
│   │   │   ├── StudyStreak.tsx       # Daily streak indicator
│   │   │   ├── WeakAreaCard.tsx      # Weak area suggestion cards
│   │   │   └── LoadingOverlay.tsx
│   │   ├── services/
│   │   │   └── api.ts                # Backend API client (axios/fetch)
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx      # React Navigation setup
│   │   ├── hooks/
│   │   │   ├── useCamera.ts
│   │   │   ├── useChat.ts
│   │   │   └── useFlashcardReview.ts
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   └── utils/
│   │       └── imageUtils.ts
│   ├── assets/                       # Icons, images, fonts
│   ├── app.json                      # Expo config
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── PLAN.md                       # This file
├── .gitignore
└── README.md
```

---

## 6. API Endpoints

### Phase 1 — Core + Differentiators

| Method | Endpoint                      | Description                                          | Request Body              |
| ------ | ----------------------------- | ---------------------------------------------------- | ------------------------- |
| POST   | `/api/capture`                | Upload image, extract text, return explanation        | `multipart/form-data`     |
| POST   | `/api/capture/process`        | One-tap: extract + explain + flashcards + quiz       | `{ session_id, image_id }`|
| POST   | `/api/chat`                   | Send a message, get AI response                      | `{ session_id, message }` |
| POST   | `/api/explain`                | Explain extracted content                            | `{ text, level? }`        |
| POST   | `/api/summarize`              | Summarize extracted content                          | `{ text, length? }`       |
| GET    | `/api/subjects`               | List all subjects                                    | —                         |
| POST   | `/api/subjects`               | Create a new subject                                 | `{ name, color? }`        |
| GET    | `/api/subjects/{id}/topics`   | List topics under a subject                          | —                         |
| POST   | `/api/subjects/{id}/topics`   | Create a topic under a subject                       | `{ name }`                |
| GET    | `/api/sessions`               | List sessions, filterable by subject/topic           | `?subject_id=&topic_id=`  |
| GET    | `/api/sessions/{id}`          | Get session details & chat history                   | —                         |
| DELETE | `/api/sessions/{id}`          | Delete a study session                               | —                         |
| POST   | `/api/flashcards/generate`    | Generate flashcards from content                     | `{ session_id, text }`    |
| GET    | `/api/flashcards`             | List all flashcards, filterable                      | `?subject_id=&topic_id=`  |
| GET    | `/api/flashcards/review`      | Get today's spaced repetition review queue           | —                         |
| PUT    | `/api/flashcards/{id}/review` | Submit flashcard review result (SM-2 update)         | `{ quality: 0-5 }`       |
| DELETE | `/api/flashcards/{id}`        | Delete a flashcard                                   | —                         |
| POST   | `/api/quiz/generate`          | Generate quiz questions from content                 | `{ session_id, text, type?, count? }` |
| POST   | `/api/quiz/{id}/submit`       | Submit quiz answers, get score                       | `{ answers: [] }`         |
| GET    | `/api/quiz/history`           | Past quiz results                                    | `?subject_id=`            |

### Phase 2 — Learning System

| Method | Endpoint                      | Description                                          | Request Body              |
| ------ | ----------------------------- | ---------------------------------------------------- | ------------------------- |
| GET    | `/api/progress/dashboard`     | Study stats: time, topics, streaks, mastery          | —                         |
| GET    | `/api/progress/weak-areas`    | AI-detected weak areas with review suggestions       | —                         |
| GET    | `/api/progress/timeline`      | Study activity timeline                              | `?range=week\|month`      |
| GET    | `/api/knowledge/search`       | Search across all extracted content & notes          | `?q=thermodynamics`       |
| GET    | `/api/knowledge/topic/{name}` | Get everything learned about a topic                 | —                         |
| POST   | `/api/math/solve`             | Solve math equation from image/text                  | `{ image?, text? }`       |
| POST   | `/api/voice/stt`              | Speech-to-text                                       | `audio/wav`               |
| POST   | `/api/voice/tts`              | Text-to-speech                                       | `{ text }`                |

---

## 7. Data Models

### Subject
```
{
  id: UUID
  name: string            # e.g. "Physics", "Biology"
  color: string           # Hex color for UI
  created_at: datetime
  topics: [Topic]
}
```

### Topic
```
{
  id: UUID
  subject_id: UUID
  name: string            # e.g. "Thermodynamics", "Cell Biology"
  created_at: datetime
}
```

### StudySession
```
{
  id: UUID
  subject_id: UUID?
  topic_id: UUID?
  title: string
  created_at: datetime
  updated_at: datetime
  images: [Image]
  messages: [Message]
  extracted_text: string
  tags: [string]          # Auto-generated topic tags
}
```

### Image
```
{
  id: UUID
  session_id: UUID
  file_path: string
  extracted_text: string
  ocr_method: "tesseract" | "llava"
  created_at: datetime
}
```

### Message
```
{
  id: UUID
  session_id: UUID
  role: "user" | "assistant"
  content: string
  created_at: datetime
}
```

### Flashcard
```
{
  id: UUID
  session_id: UUID
  subject_id: UUID?
  topic_id: UUID?
  front: string           # Question / term
  back: string            # Answer / definition
  # SM-2 Spaced Repetition Fields
  easiness_factor: float  # Default 2.5
  interval: int           # Days until next review
  repetitions: int        # Successful reviews in a row
  next_review: date       # When to show next
  created_at: datetime
  last_reviewed: datetime?
}
```

### QuizQuestion
```
{
  id: UUID
  quiz_id: UUID
  question: string
  options: [string]        # For MCQ
  correct_answer: string
  explanation: string
  type: "mcq" | "true_false" | "short_answer"
}
```

### Quiz
```
{
  id: UUID
  session_id: UUID
  subject_id: UUID?
  topic_id: UUID?
  questions: [QuizQuestion]
  created_at: datetime
}
```

### QuizAttempt
```
{
  id: UUID
  quiz_id: UUID
  answers: [{ question_id: UUID, answer: string, correct: bool }]
  score: float             # Percentage
  completed_at: datetime
}
```

### StudyProgress
```
{
  id: UUID
  date: date
  subject_id: UUID?
  topic_id: UUID?
  sessions_count: int
  flashcards_reviewed: int
  quiz_score_avg: float
  time_spent_minutes: int
}
```

---

## 8. Development Milestones

### Phase 1: MVP with Differentiators

#### Milestone 1: Backend Foundation
- [ ] FastAPI project setup with proper structure
- [ ] Ollama installation and model pulling (LLaMA 3.1, LLaVA)
- [ ] Basic health check and configuration
- [ ] Database setup (SQLAlchemy + SQLite)
- [ ] Subject & Topic CRUD endpoints

#### Milestone 2: OCR Pipeline
- [ ] Tesseract OCR integration for printed text
- [ ] LLaVA vision integration for handwriting/diagrams
- [ ] Image preprocessing (rotation, cropping, enhancement)
- [ ] `/api/capture` endpoint
- [ ] Auto-detect OCR method based on content type

#### Milestone 3: Core AI Features
- [ ] Concept explanation via LLaMA
- [ ] Q&A chat with context from extracted text
- [ ] Summary generation
- [ ] `/api/chat`, `/api/explain`, `/api/summarize` endpoints

#### Milestone 4: One-Tap Flashcard Generation ★
- [ ] AI-powered flashcard generation from extracted content
- [ ] `/api/flashcards/generate` endpoint
- [ ] Flashcard CRUD endpoints
- [ ] Generate 5-10 cards per captured page automatically

#### Milestone 5: One-Tap Quiz Generation ★
- [ ] MCQ, true/false, short-answer generation from content
- [ ] `/api/quiz/generate` endpoint
- [ ] Quiz submission and scoring
- [ ] Quiz history tracking

#### Milestone 6: Mobile App Shell
- [ ] Expo + React Native project setup
- [ ] Navigation structure (Home, Camera, Subjects, History, Progress)
- [ ] Camera screen with capture functionality
- [ ] Image preview with one-tap action buttons (Explain / Flashcards / Quiz)

#### Milestone 7: End-to-End Integration
- [ ] Connect mobile app to backend API
- [ ] Camera → OCR → AI explanation flow
- [ ] One-tap: photo → flashcards generated → quiz ready
- [ ] Chat interface with message history
- [ ] Error handling and loading states

#### Milestone 8: Organized Study Sessions ★
- [ ] Subject & topic management UI
- [ ] Sessions organized under subjects → topics
- [ ] History screen with filtering by subject/topic
- [ ] Session detail view with images, chat, flashcards, quiz results

### Phase 2: Learning System (The Moat)

#### Milestone 9: Spaced Repetition ★
- [ ] SM-2 algorithm implementation
- [ ] Daily review queue (`/api/flashcards/review`)
- [ ] Flashcard review submission with quality rating
- [ ] FlashcardReviewScreen with swipe UX
- [ ] Push notification reminders for due reviews

#### Milestone 10: Progress Tracking & Weak Areas ★
- [ ] Study progress data collection (time, sessions, scores)
- [ ] `/api/progress/dashboard` endpoint
- [ ] `/api/progress/weak-areas` — AI analysis of quiz scores by topic
- [ ] ProgressScreen with charts (topics studied, mastery, streaks)
- [ ] WeakAreaCard suggestions on home screen

#### Milestone 11: Cumulative Knowledge Base ★
- [ ] Full-text search across all extracted content
- [ ] `/api/knowledge/search` and `/api/knowledge/topic/{name}`
- [ ] KnowledgeScreen — "Show me everything about [topic]"
- [ ] Cross-session concept linking

#### Milestone 12: Math/Equation Solving
- [ ] Math expression recognition from images
- [ ] Step-by-step solution generation
- [ ] LaTeX/formatted equation display in mobile app

#### Milestone 13: Voice Interaction
- [ ] Speech-to-text integration (Whisper via Ollama or expo-speech)
- [ ] Text-to-speech for answers
- [ ] Voice-activated Q&A mode

### Phase 3: Growth & Polish

#### Milestone 14: Study Analytics & Insights
- [ ] Weekly study reports
- [ ] Study streaks with visual indicators
- [ ] Optimal study time suggestions
- [ ] Export study data

#### Milestone 15: Integrations & Export
- [ ] Export flashcards to Anki / Quizlet format
- [ ] PDF / document upload for batch processing
- [ ] Pomodoro timer integration
- [ ] Cross-topic concept linking with visual graph

---

## 9. Prerequisites & Setup

### Required Software
- **Node.js** >= 18.x
- **Python** >= 3.10
- **Ollama** (https://ollama.ai)
- **Tesseract OCR** (https://github.com/tesseract-ocr/tesseract)
- **Expo CLI** (`npm install -g expo-cli`)

### Ollama Models to Pull
```bash
ollama pull llama3.1        # Text generation (8B)
ollama pull llava           # Vision understanding (7B)
```

### Python Dependencies (Key)
- `fastapi`, `uvicorn` — Web framework
- `pytesseract` — Tesseract OCR wrapper
- `Pillow` — Image processing
- `httpx` — Async HTTP client (for Ollama API)
- `sqlalchemy` — ORM
- `python-multipart` — File uploads
- `pydantic` — Data validation

### React Native Dependencies (Key)
- `expo-camera` — Camera access
- `expo-image-picker` — Gallery picker
- `@react-navigation/native` — Navigation
- `axios` — HTTP client
- `expo-speech` — Text-to-speech (Phase 2)

---

## 10. Notes & Decisions

### Why This Exists (Not Another ChatGPT)
- ChatGPT/Claude are general-purpose chat tools. Students *can* use them, but the UX is: type prompt → read response → manually copy → repeat.
- StudyAssist is a **purpose-built study system**: snap photo → one tap → flashcards + quiz + explanation all generated automatically, organized by subject, tracked over time.
- The real value is **not** the AI chat — it's the structured learning system built on top: spaced repetition, auto-quizzes, progress tracking, and a cumulative knowledge base.

### Key Technical Decisions
- **Why Ollama?** Zero API costs, data privacy (everything local), no internet dependency for AI inference.
- **Why Tesseract + LLaVA?** Tesseract is fast and accurate for printed text. LLaVA handles what Tesseract can't — handwriting, diagrams, context-aware extraction.
- **Why React Native + Expo?** Single codebase for iOS + Android, fast development with Expo managed workflow, rich ecosystem.
- **Why SM-2 for spaced repetition?** Battle-tested algorithm (used by Anki), simple to implement, proven to improve long-term retention.
- **Scaling path:** Swap Ollama for a cloud LLM (OpenAI, Gemini) by changing only `llm_service.py` — the rest stays the same.

### Development Priority Order
1. **Differentiators first** — flashcards, quizzes, organized sessions go into MVP, not Phase 2
2. **Learning system second** — spaced repetition, progress tracking, knowledge base create the moat
3. **Nice-to-haves last** — voice, math solving, export are valuable but not what makes the app unique

---

## 11. Build & CI/CD Pipeline

### Backend Build

| Stage         | Tool                           | Details                                    |
| ------------- | ------------------------------ | ------------------------------------------ |
| Linting       | `ruff` / `flake8`              | Enforce code style on every commit         |
| Type checking | `mypy`                         | Catch type errors early                    |
| Unit tests    | `pytest`                       | Run on every push                          |
| Docker build  | `Dockerfile`                   | Multi-stage build for production image     |
| API tests     | `pytest` + `httpx.AsyncClient` | Integration tests against test DB          |

### Mobile Build

| Stage         | Tool                     | Details                                        |
| ------------- | ------------------------ | ---------------------------------------------- |
| Linting       | `eslint` + `prettier`   | Enforce code style                             |
| Type checking | TypeScript compiler      | Strict mode                                    |
| Unit tests    | `jest`                   | Component + service tests                      |
| Dev build     | `expo start`             | Local development with Expo Go                 |
| Preview build | `eas build --profile preview` | Installable APK/IPA for testing           |
| Prod build    | `eas build --profile production` | Signed builds for store submission      |

### CI/CD Pipeline (GitHub Actions)

```
Push to main
  ├── Backend
  │   ├── Lint + Type Check
  │   ├── Run pytest
  │   ├── Build Docker image
  │   └── Push to container registry (if tagged)
  │
  └── Mobile
      ├── Lint + Type Check
      ├── Run jest
      └── Trigger EAS Build (on release tags)

Pull Request
  ├── All lint + test checks must pass
  └── Preview build deployed for review (optional)
```

### Environments

| Environment  | Backend                      | Mobile                         | Database      |
| ------------ | ---------------------------- | ------------------------------ | ------------- |
| **Local**    | `uvicorn` on localhost:8000  | Expo Go on phone/emulator      | SQLite        |
| **Staging**  | Docker on VPS / cloud VM     | EAS preview build (TestFlight) | PostgreSQL    |
| **Production** | Docker on VPS / cloud VM   | App Store / Play Store         | PostgreSQL    |

---

## 12. Deployment Strategy

### Backend Deployment

#### Option A: Self-Hosted VPS (Recommended for Ollama)
Since Ollama runs locally, the backend needs a **GPU-capable server** or a machine with enough RAM for LLaMA (8B needs ~8GB RAM):

```
VPS / Dedicated Server (e.g., Hetzner, DigitalOcean GPU droplet)
├── Docker Compose
│   ├── fastapi-app (backend container)
│   ├── ollama (AI model server)
│   ├── postgres (database)
│   └── nginx (reverse proxy + SSL)
```

| Component      | Specs (Minimum)                 | Specs (Recommended)              |
| -------------- | ------------------------------- | -------------------------------- |
| CPU            | 4 cores                        | 8 cores                         |
| RAM            | 16 GB                          | 32 GB                           |
| GPU            | Optional (CPU inference works)  | NVIDIA GPU (10x faster)          |
| Storage        | 50 GB SSD                      | 100 GB NVMe SSD                 |
| OS             | Ubuntu 22.04+                  | Ubuntu 24.04                    |

#### Option B: Cloud with API-Based LLM (Scale path)
If moving away from Ollama to a cloud LLM (OpenAI/Gemini):
- Backend → Docker on AWS ECS / Google Cloud Run / Azure Container Apps
- No GPU needed, just standard containers
- Swap `llm_service.py` to use API calls instead of local Ollama

#### Deployment Flow
```
Developer pushes tag (v1.0.0)
  → GitHub Actions builds Docker image
  → Pushes to Docker Hub / GitHub Container Registry
  → SSH into VPS → docker compose pull && docker compose up -d
  (or) ArgoCD / Watchtower auto-deploys
```

### Mobile Deployment
- **Development**: Expo Go app (scan QR code, instant testing)
- **Internal Testing**: EAS Build → APK (Android) / TestFlight (iOS)
- **Production**: EAS Build → Submit to Play Store / App Store

---

## 13. App Store Strategy

### Google Play Store

| Item                 | Details                                                    |
| -------------------- | ---------------------------------------------------------- |
| **Developer Account**| One-time $25 fee                                           |
| **Category**         | Education → Study Tools                                    |
| **Target Audience**  | 13+ (avoid COPPA issues — no under-13 targeting)           |
| **Content Rating**   | Everyone                                                   |
| **Listing Title**    | "StudyAssist — AI Study Companion"                         |
| **Short Description**| "Snap a photo of your textbook. Get flashcards, quizzes & explanations instantly." |
| **Key Screenshots**  | 1. Camera capture 2. One-tap results 3. Flashcards 4. Quiz 5. Progress dashboard |
| **Review Timeline**  | ~1-3 days for initial review                               |
| **Update Frequency** | Every 2-4 weeks                                            |

#### Play Store Checklist
- [ ] Privacy Policy URL (required — must disclose local data processing)
- [ ] Data Safety form (declare: no data sent to servers if fully local)
- [ ] App signing with Google Play App Signing
- [ ] Target API level compliance (currently API 34+)
- [ ] Provide demo account or test instructions for reviewer
- [ ] Screenshots for phone + tablet (if supported)

### Apple App Store

| Item                 | Details                                                    |
| -------------------- | ---------------------------------------------------------- |
| **Developer Account**| $99/year (Apple Developer Program)                         |
| **Category**         | Education                                                  |
| **Age Rating**       | 4+ or 12+ (if user-generated content)                     |
| **Listing Title**    | "StudyAssist — AI Study Companion"                         |
| **Subtitle**         | "Photo to Flashcards & Quizzes"                            |
| **Review Timeline**  | ~1-2 days (can be faster with expedited review)            |

#### App Store Checklist
- [ ] App Review Guidelines compliance (Section 4.2 — must provide substantial value)
- [ ] Privacy nutrition labels (camera access, local storage)
- [ ] Privacy Policy URL
- [ ] App Tracking Transparency (ATT) — N/A if no tracking
- [ ] Screenshots for iPhone (6.7", 6.5"), iPad (if supported)
- [ ] Xcode-signed build via EAS
- [ ] TestFlight beta testing before submission

### App Store Risks & Mitigations

| Risk                                  | Mitigation                                              |
| ------------------------------------- | ------------------------------------------------------- |
| Apple rejects "thin wrapper" apps     | App has structured study features (flashcards, quizzes, spaced repetition) beyond just AI chat |
| "Requires external server" rejection  | Bundle fallback experience or clearly state requirements |
| Camera permission rejection           | Clear purpose string: "Used to capture study materials"  |
| Age-related compliance (COPPA/GDPR-K) | Target 13+, don't collect personal data, all data local  |
| App Store guideline 4.7 (AI apps)     | Must attribute AI-generated content, no harmful outputs  |

### Launch Strategy

```
Phase         Timeline        Actions
─────────────────────────────────────────────────────────────
Alpha         Milestone 7     Internal testing (dev team, friends)
Closed Beta   Milestone 8     50-100 students via TestFlight + APK
Open Beta     Milestone 10    Play Store open testing track
v1.0 Launch   Milestone 11    Full store release (both platforms)
```

### ASO (App Store Optimization)
- **Keywords**: study app, flashcards, AI tutor, quiz maker, photo to flashcard, study helper, exam prep
- **Localization**: English first, then Hindi, Spanish, Mandarin (large student populations)
- **Ratings prompt**: Ask for review after 5th successful study session (not on first use)
- **A/B test**: Store listing experiments on Play Store for screenshots & descriptions

---

## 14. Testing Strategy

| Type              | Tool / Framework            | Scope                                     |
| ----------------- | --------------------------- | ----------------------------------------- |
| **Unit (Backend)**| `pytest`                    | Services, utils, business logic           |
| **Unit (Mobile)** | `jest` + React Testing Lib  | Components, hooks, services               |
| **API Integration** | `pytest` + `httpx`        | Full endpoint testing with test DB        |
| **E2E (Mobile)**  | Detox or Maestro            | Critical flows: capture → flashcard → quiz|
| **OCR Accuracy**  | Custom test suite           | Benchmark against known image samples     |
| **AI Quality**    | Manual + automated prompts  | Verify explanation quality, flashcard relevance |
| **Performance**   | Lighthouse / custom timing  | API response times, model inference speed |

### Test Coverage Targets
- Backend services: **80%+**
- API routes: **90%+** (every endpoint has a happy + error path test)
- Mobile components: **70%+**
- E2E critical flows: **100%** of core user journeys

---

## 15. Security & Privacy

### Data Handling
- **All AI processing is local** (Ollama) — no student data sent to third-party APIs
- **Images stored locally** on server filesystem (not cloud by default)
- **No user accounts required** for MVP — device-based sessions
- **No analytics/tracking SDKs** — fully private

### Security Measures
| Area                  | Measure                                                   |
| --------------------- | --------------------------------------------------------- |
| API Communication     | HTTPS only (TLS 1.2+), no HTTP fallback                  |
| File Uploads          | Validate file type (image only), size limits (10MB max)   |
| Input Sanitization    | Pydantic validation on all inputs, no raw SQL             |
| Rate Limiting         | Backend rate limiter to prevent abuse                     |
| Image Storage         | Sanitize filenames, store outside web root                |
| Dependencies          | `dependabot` / `safety` for vulnerability scanning        |
| Secrets               | `.env` files, never committed; documented in `.env.example` |

### Compliance
| Regulation    | Applicability          | How We Comply                              |
| ------------- | ---------------------- | ------------------------------------------ |
| **COPPA**     | Users under 13 (US)    | Target 13+, no personal data collection    |
| **GDPR**      | EU users               | All data local, no tracking, no PII stored |
| **GDPR-K**    | EU minors              | Parental consent not needed if no PII      |
| **FERPA**     | US educational records  | No school integration, student-owned data  |
| **App Store** | Apple/Google policies  | Privacy nutrition labels, purpose strings  |

---

## 16. Monetization Strategy (Future)

### Phase 1-2: Free & Open Source
- Build user base and community trust
- No ads, no paywalls, no data selling
- Open-source backend encourages contributions

### Phase 3+: Sustainable Revenue Options

| Model                    | Description                                           | Revenue     |
| ------------------------ | ----------------------------------------------------- | ----------- |
| **Freemium**             | Free core + premium features (advanced analytics, unlimited subjects) | Subscription |
| **Cloud Hosted Plan**    | Managed backend (no self-hosting needed), faster cloud AI models | $5-10/month |
| **Institutional License**| Bulk license for schools/universities with teacher dashboards | Per-seat    |
| **Export Premium**       | Free app, paid export to Anki/Quizlet/PDF             | One-time    |
| **Donation / Sponsors**  | Open-source with GitHub Sponsors / Buy Me a Coffee    | Voluntary   |

### Recommended Path
1. Launch **100% free** — maximize adoption
2. Add **Cloud Hosted Plan** for users who don't want to run Ollama locally
3. Add **Institutional License** when teacher/parent features ship

---

## 17. Monitoring & Analytics

### Backend Monitoring
| What                  | Tool                              |
| --------------------- | --------------------------------- |
| API health & uptime   | `/api/health` + UptimeRobot/Kuma  |
| Request logging       | Structured logging (Python `logging` / `structlog`) |
| Error tracking        | Sentry (self-hosted or free tier) |
| API metrics           | Prometheus + Grafana (optional)   |
| Ollama model status   | Health check endpoint             |

### Mobile Analytics (Privacy-Respecting)
| What                  | Tool                              |
| --------------------- | --------------------------------- |
| Crash reporting       | Sentry (no PII)                   |
| Usage patterns        | PostHog (self-hosted, anonymous)  |
| App performance       | Expo Updates + EAS Insights       |

> **No** Google Analytics, Firebase Analytics, or any third-party tracking that sends student data to cloud. Privacy is a core differentiator.

---

## 18. User Onboarding & UX Flow

### First-Time User Flow
```
Install App
  → Welcome screen (3 slides: Capture → Learn → Track)
  → Camera permission request (with clear explanation)
  → "Snap your first page!" prompt
  → Camera opens → capture → instant results
  → Prompt to create a Subject ("What are you studying?")
  → Home dashboard with first session saved
```

### Core User Journey (Daily Use)
```
Open App
  → Home dashboard shows:
      • "X flashcards due for review today"
      • "Continue: [last session topic]"
      • Study streak counter
      • Weak areas to revisit
  → User taps "Review Flashcards" or "New Capture"
  → Study session begins
```

---

## 19. Risk Assessment

| Risk                                  | Impact | Likelihood | Mitigation                                      |
| ------------------------------------- | ------ | ---------- | ----------------------------------------------- |
| Ollama too slow on CPU                | High   | Medium     | Offer cloud LLM fallback option                 |
| LLaVA poor handwriting recognition    | Medium | Medium     | Fallback to Google Vision API; let users correct |
| React Native camera issues on devices | Medium | Medium     | Use expo-camera with fallback to image picker    |
| Apple rejects the app                 | High   | Low        | Substantial features beyond AI chat; follow 4.7  |
| Student generates inappropriate content| Medium | Low       | Content filtering on AI responses                |
| Backend server costs too high         | Medium | Low        | Start with affordable VPS; monetize if scaling   |
| Competitor launches similar product   | Medium | Medium     | Speed to market; open-source community moat      |
| Ollama models improve / change API    | Low    | Medium     | Abstraction layer in `llm_service.py`            |

---

## 20. Source Control & Repository

- **Platform**: GitHub (public repository)
- **Repo URL**: `github.com/<username>/StudyAssist`
- **License**: MIT (encourage contributions, allow forks)
- **Branch Strategy**: GitHub Flow (simple)

| Branch        | Purpose                                           |
| ------------- | ------------------------------------------------- |
| `main`        | Production-ready code, protected branch           |
| `develop`     | Integration branch for features                   |
| `feature/*`   | Feature branches (`feature/flashcard-generation`)  |
| `fix/*`       | Bug fix branches                                  |
| `release/*`   | Release preparation                               |

### GitHub Actions CI/CD (Free for Public Repos)
- **Unlimited CI/CD minutes** — no cost
- **Workflows**: lint → test → build → deploy (on tag)
- **Secrets**: Store API keys, server SSH keys in GitHub Secrets
- **Environments**: staging + production with approval gates

### Public Repo Considerations
- `.env` files in `.gitignore` (never commit secrets)
- No API keys, passwords, or server IPs in code
- Use `.env.example` to document required environment variables
- Ollama model config via environment variables, not hardcoded

---

## 21. Cost Breakdown

### Free Services

| Service                       | Free Tier                    | Notes                          |
| ----------------------------- | ---------------------------- | ------------------------------ |
| GitHub (public repo)          | Unlimited repos              | Code, issues, wiki, projects   |
| GitHub Actions CI/CD          | **Unlimited minutes**        | Public repos only              |
| GitHub Container Registry     | 500 MB storage               | Docker image hosting           |
| Let's Encrypt SSL             | Unlimited certs              | Auto-renew via Certbot/Caddy   |
| Sentry error tracking         | 5K errors/month              | Crash reporting                |
| UptimeRobot                   | 50 monitors                  | Health check monitoring        |
| EAS Build (Expo)              | 30 builds/month              | Dev + preview builds           |

### One-Time Costs

| Item                          | Cost          | Required?       |
| ----------------------------- | ------------- | --------------- |
| Google Play Developer         | **$25**       | Yes (Play Store)|
| Apple Developer Program       | **$99/year**  | Yes (App Store) |
| Domain registration           | $10-15/year   | Optional        |

### Monthly Server Costs by Phase

#### Development & Beta (~$8-10/month)
| Item                          | Service                     | Cost           |
| ----------------------------- | --------------------------- | -------------- |
| Backend + Ollama              | Hetzner CAX21 (8GB ARM)     | ~$8/mo         |
| Database                      | SQLite (on same server)     | $0             |
| CI/CD                         | GitHub Actions (free)       | $0             |
| Builds                        | EAS free tier               | $0             |
| **Total**                     |                             | **~$8-10/mo**  |

> LLaMA 3.1 8B on CPU = ~5-15 sec/response. Fine for beta.

#### Launch & Growth (~$16-20/month)
| Item                          | Service                     | Cost           |
| ----------------------------- | --------------------------- | -------------- |
| Backend + Ollama              | Hetzner CAX31 (16GB ARM)    | ~$16/mo        |
| Database                      | PostgreSQL (same server)    | $0             |
| CI/CD                         | GitHub Actions (free)       | $0             |
| Builds                        | EAS free tier               | $0             |
| **Total**                     |                             | **~$16-20/mo** |

#### Scale / Fast Inference (~$40-50/month)
| Item                          | Service                     | Cost           |
| ----------------------------- | --------------------------- | -------------- |
| GPU Server                    | RunPod / Vast.ai (RTX 3060) | ~$30-40/mo     |
| Database                      | Managed Postgres (Supabase free) | $0         |
| EAS Build                     | Pro ($15/mo) if needed      | $0-15/mo       |
| **Total**                     |                             | **~$35-55/mo** |

#### Alternative: Cloud LLM Instead of Ollama
| Item                          | Cost                        | Notes          |
| ----------------------------- | --------------------------- | -------------- |
| Cheap VPS (no GPU needed)     | $5/mo                       | Just runs FastAPI |
| Groq API (hosted LLaMA)       | ~$0.10-0.20/student/mo      | Very cheap, fast |
| Google Gemini Flash            | ~$0.25-0.50/student/mo      | Good quality   |
| OpenAI GPT-4o-mini            | ~$0.50-1.00/student/mo      | Best quality   |

### Estimated Year 1 Total

| Phase                   | Duration    | Monthly Cost | Subtotal |
| ----------------------- | ----------- | ------------ | -------- |
| Development (local)     | 2-3 months  | $0           | $0       |
| Beta (Hetzner CAX21)    | 2-3 months  | ~$8          | ~$24     |
| Launch (Hetzner CAX31)  | 6 months    | ~$16         | ~$96     |
| One-time fees           | —           | —            | ~$135    |
| **Year 1 Total**        |             |              | **~$255**|
