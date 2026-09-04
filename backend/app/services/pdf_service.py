"""PDF validation and text extraction for chapter uploads."""

import io
import re

from pypdf import PdfReader


class PdfExtractionError(ValueError):
    """Raised when a PDF cannot provide usable text."""


def extract_pdf_text(content: bytes, max_pages: int) -> tuple[str, int]:
    """Return normalized text from a text-based PDF and its page count."""
    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as error:
        raise PdfExtractionError("The uploaded file is not a valid PDF.") from error

    if reader.is_encrypted:
        raise PdfExtractionError("Password-protected PDFs cannot be processed.")

    page_count = len(reader.pages)
    if page_count == 0:
        raise PdfExtractionError("The PDF has no pages.")
    if page_count > max_pages:
        raise PdfExtractionError(f"The PDF has {page_count} pages; the limit is {max_pages}.")

    pages = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if text:
            pages.append(f"[Page {page_number}]\n{text}")

    extracted_text = "\n\n".join(pages).strip()
    if len(extracted_text) < 100:
        raise PdfExtractionError(
            "No readable text was found. This looks like a scanned PDF; use camera capture instead."
        )
    return extracted_text, page_count


def generation_chunks(text: str, chunk_size: int, count: int = 2) -> list[str]:
    """Choose evenly distributed, bounded chapter excerpts for LLM generation."""
    if len(text) <= chunk_size:
        return [text]

    max_start = len(text) - chunk_size
    starts = [round(index * max_start / (count - 1)) for index in range(count)]
    chunks = []
    for start in starts:
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
    return chunks