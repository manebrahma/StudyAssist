from pathlib import Path
from PIL import Image
import io
import uuid


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
MAX_DIMENSION = 4096


def validate_image(filename: str, content: bytes, max_size: int) -> None:
    """Validate uploaded image file type and size."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if len(content) > max_size:
        raise ValueError(
            f"File too large ({len(content)} bytes). Max: {max_size} bytes"
        )
    # Verify it's actually an image by trying to open it
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
    except Exception:
        raise ValueError("File is not a valid image")


def generate_filename(original_filename: str) -> str:
    """Generate a unique filename preserving the original extension."""
    ext = Path(original_filename).suffix.lower()
    return f"{uuid.uuid4().hex}{ext}"


def preprocess_image(image_bytes: bytes) -> bytes:
    """Basic image preprocessing: resize if too large, convert to RGB."""
    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if needed (e.g., RGBA PNGs)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Resize if any dimension exceeds MAX_DIMENSION
    if max(img.size) > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()
