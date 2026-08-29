"""Test OCR Pipeline: capture endpoint → Tesseract Docker"""
import httpx
from PIL import Image, ImageDraw
import io
import json

BASE = "http://localhost:8000/api"

# Step 1: Test health (includes OCR status)
print("=== HEALTH CHECK ===")
r = httpx.get(f"{BASE}/health", timeout=10)
h = r.json()
print(f"Status: {h['status']}, AI: {h['ollama_status']}, OCR: {h['ocr_status']}, DB: {h['database_status']}")

# Step 2: Create a session
print("\n=== CREATE SESSION ===")
session = httpx.post(f"{BASE}/sessions", json={"title": "OCR Test"}, timeout=10).json()
sid = session["id"]
print(f"Session: {sid}")

# Step 3: Create a test image with readable text
print("\n=== GENERATE TEST IMAGE ===")
img = Image.new("RGB", (600, 200), "white")
d = ImageDraw.Draw(img)
lines = [
    "The mitochondria is the powerhouse of the cell.",
    "Photosynthesis converts sunlight into energy.",
    "DNA carries genetic information in all living organisms.",
]
y = 30
for line in lines:
    d.text((30, y), line, fill="black")
    y += 45
buf = io.BytesIO()
img.save(buf, format="PNG")
img_bytes = buf.getvalue()
print(f"Image size: {len(img_bytes)} bytes")

# Step 4: Upload to capture endpoint
print("\n=== CAPTURE & OCR ===")
files = {"file": ("test_biology.png", img_bytes, "image/png")}
data = {"session_id": sid}
r = httpx.post(f"{BASE}/capture", files=files, data=data, timeout=30)
print(f"Status: {r.status_code}")
if r.status_code == 201:
    result = r.json()
    print(f"OCR Method: {result.get('ocr_method')}")
    print(f"Extracted Text:\n{result.get('extracted_text', '(none)')}")
else:
    print(f"Error: {r.text[:300]}")

# Step 5: Verify session has extracted text
print("\n=== VERIFY SESSION ===")
s = httpx.get(f"{BASE}/sessions/{sid}", timeout=10).json()
print(f"Session extracted text length: {len(s.get('extracted_text') or '')}")
print(f"Session extracted text:\n{s.get('extracted_text', '(none)')[:300]}")

print("\nAll OCR tests complete!")
