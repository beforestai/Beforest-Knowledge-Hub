import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from backend.app.core.config import get_settings


def file_type_from_name(name: str) -> str:
    extension = (name.rsplit(".", 1)[-1] if "." in name else "").lower()
    mapping = {
        "md": "Text Page",
        "pdf": "PDF",
        "doc": "Document",
        "docx": "Document",
        "xls": "Spreadsheet",
        "xlsx": "Spreadsheet",
        "csv": "Spreadsheet",
        "ppt": "Deck",
        "pptx": "Deck",
        "png": "Image",
        "jpg": "Image",
        "jpeg": "Image",
    }
    return mapping.get(extension, "File")


def safe_file_name(name: str) -> str:
    source = Path(name or "upload").name
    stem = Path(source).stem or "upload"
    suffix = Path(source).suffix.lower()
    cleaned = "".join(char if char.isalnum() or char in ("-", "_") else "-" for char in stem).strip("-")
    return f"{cleaned or 'upload'}{suffix}"


def save_upload_file(upload: UploadFile) -> dict[str, object]:
    upload_dir = Path(get_settings().upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    original_name = upload.filename or "upload"
    stored_name = f"{uuid.uuid4().hex}-{safe_file_name(original_name)}"
    storage_path = upload_dir / stored_name

    with storage_path.open("wb") as output:
        shutil.copyfileobj(upload.file, output)

    return {
        "file_name": original_name,
        "file_type": file_type_from_name(original_name),
        "file_storage_path": str(storage_path),
        "file_size_bytes": storage_path.stat().st_size,
        "file_content_type": upload.content_type or "",
    }
