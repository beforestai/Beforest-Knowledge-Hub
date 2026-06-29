from sqlalchemy import text

from backend.app.db.session import engine


STATEMENTS = [
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingestion_status VARCHAR(40) NOT NULL DEFAULT 'not_required'",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingestion_job_id VARCHAR(120) NOT NULL DEFAULT ''",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingestion_error TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingestion_chunk_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMP WITH TIME ZONE",
]


def main() -> None:
    with engine.begin() as connection:
        for statement in STATEMENTS:
            connection.execute(text(statement))
    print("KMS ingestion queue columns are ready.")


if __name__ == "__main__":
    main()
