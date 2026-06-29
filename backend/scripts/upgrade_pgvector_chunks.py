from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.db.session import engine


def main() -> None:
    settings = get_settings()
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        connection.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingestion_chunk_count INTEGER NOT NULL DEFAULT 0"))
        connection.execute(
            text(
                f"""
                CREATE TABLE IF NOT EXISTS document_chunks (
                    id UUID PRIMARY KEY,
                    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                    chunk_index INTEGER NOT NULL,
                    text TEXT NOT NULL,
                    token_count_estimate INTEGER NOT NULL DEFAULT 0,
                    embedding_model VARCHAR(160) NOT NULL,
                    embedding vector({settings.embedding_dimensions}) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                )
                """
            )
        )
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_document_chunks_document_id ON document_chunks(document_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_document_chunks_document_sequence ON document_chunks(document_id, chunk_index)"))
        connection.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_cosine "
                "ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
            )
        )
    print("KMS pgvector document chunks are ready.")


if __name__ == "__main__":
    main()
