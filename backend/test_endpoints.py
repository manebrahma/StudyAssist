"""Quick test script for flashcard and quiz endpoints."""
import httpx
import json

BASE = "http://localhost:8000"
TEXT = (
    "The cell membrane is a selectively permeable barrier. "
    "Osmosis is the movement of water across a semipermeable membrane from low solute to high solute concentration. "
    "Diffusion is passive transport of molecules from high to low concentration. "
    "Active transport requires ATP energy to move molecules against their concentration gradient."
)

# Create session
s = httpx.post(f"{BASE}/api/sessions", json={"title": "Test Session"}, timeout=10).json()
sid = s["id"]
print(f"Session: {sid}\n")

# Test flashcard generation
print("=== FLASHCARD GENERATION ===")
r = httpx.post(f"{BASE}/api/flashcards/generate", json={"session_id": sid, "text": TEXT, "count": 3}, timeout=300)
print(f"Status: {r.status_code}")
if r.status_code == 201:
    cards = r.json()
    for c in cards:
        print(f"  Q: {c['front']}")
        print(f"  A: {c['back']}")
        print()

    # Test review queue
    print("=== REVIEW QUEUE ===")
    r2 = httpx.get(f"{BASE}/api/flashcards/review", timeout=10)
    print(f"Cards due today: {len(r2.json())}")

    # Test SM-2 review
    if cards:
        card_id = cards[0]["id"]
        print(f"\n=== SM-2 REVIEW (quality=5, card {card_id[:8]}...) ===")
        r3 = httpx.put(f"{BASE}/api/flashcards/{card_id}/review", json={"quality": 5}, timeout=10)
        updated = r3.json()
        print(f"  Interval: {updated['interval']} days")
        print(f"  Next review: {updated['next_review']}")
        print(f"  EF: {updated['easiness_factor']}")
else:
    print(r.text)

# Test quiz generation
print("\n=== QUIZ GENERATION ===")
r4 = httpx.post(f"{BASE}/api/quiz/generate", json={"session_id": sid, "text": TEXT, "question_type": "mcq", "count": 2}, timeout=300)
print(f"Status: {r4.status_code}")
if r4.status_code == 201:
    quiz = r4.json()
    quiz_id = quiz["id"]
    print(f"Quiz ID: {quiz_id}")
    for q in quiz["questions"]:
        print(f"  Q: {q['question']}")
        if q["options"]:
            opts = json.loads(q["options"]) if isinstance(q["options"], str) else q["options"]
            for i, o in enumerate(opts):
                print(f"     {chr(65+i)}) {o}")
        print()

    # Submit answers
    print("=== QUIZ SUBMISSION ===")
    answers = [{"question_id": q["id"], "answer": "guess"} for q in quiz["questions"]]
    r5 = httpx.post(f"{BASE}/api/quiz/{quiz_id}/submit", json={"answers": answers}, timeout=10)
    result = r5.json()
    print(f"Score: {result['score']:.0f}% ({result['correct_count']}/{result['total_questions']})")
else:
    print(r4.text)

print("\nAll tests complete!")
