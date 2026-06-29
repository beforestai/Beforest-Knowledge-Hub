from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from backend.app.db.session import SessionLocal
from backend.app.models.document import Document
from backend.app.services.chunking import chunk_text
from backend.app.services.document_chunks import replace_document_chunks
from backend.app.services.document_extraction import extract_text_from_file
from backend.app.services.embeddings import embed_chunks


def process_document_ingestion(document_id: str, file_storage_path: str) -> dict[str, str]:
    with SessionLocal() as db:
        document = db.get(Document, UUID(document_id))
        if not document:
            raise ValueError(f"Document {document_id} not found.")

        document.ingestion_status = "processing"
        document.ingestion_error = ""
        db.commit()

        try:
            path = Path(file_storage_path)
            if not path.exists():
                raise FileNotFoundError(f"Uploaded file not found: {file_storage_path}")

            extracted_text = extract_text_from_file(path, document.file_content_type)
            chunks = chunk_text(extracted_text)
            if not chunks:
                raise ValueError("No extractable text found in uploaded document.")

            embeddings = embed_chunks(chunks)
            chunk_count = replace_document_chunks(db, document.id, chunks, embeddings)

            document.ingestion_status = "completed"
            document.ingested_at = datetime.now(timezone.utc)
            document.ingestion_error = ""
            document.ingestion_chunk_count = chunk_count
            db.commit()
            return {"document_id": document_id, "status": "completed", "chunks": str(chunk_count)}
        except Exception as exc:
            document.ingestion_status = "failed"
            document.ingestion_error = str(exc)
            db.commit()
            raise
