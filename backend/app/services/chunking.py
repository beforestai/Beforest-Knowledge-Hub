from backend.app.core.config import get_settings


def normalize_text(value: str) -> str:
    return "\n".join(line.strip() for line in value.splitlines() if line.strip())


def chunk_text(value: str) -> list[str]:
    settings = get_settings()
    text = normalize_text(value)
    if not text:
        return []

    target = max(settings.chunk_target_chars, 200)
    overlap = min(max(settings.chunk_overlap_chars, 0), target // 2)
    chunks: list[str] = []
    start = 0

    while start < len(text):
        end = min(start + target, len(text))
        if end < len(text):
            boundary = max(text.rfind("\n", start, end), text.rfind(". ", start, end), text.rfind(" ", start, end))
            if boundary > start + target // 2:
                end = boundary + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break
        start = max(end - overlap, start + 1)

    return chunks


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)
