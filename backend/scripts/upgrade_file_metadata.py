from sqlalchemy import text

from backend.app.db.session import engine


STATEMENTS = [
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_storage_path TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER",
    "ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_content_type VARCHAR(160) NOT NULL DEFAULT ''",
]


def main() -> None:
    with engine.begin() as connection:
        for statement in STATEMENTS:
            connection.execute(text(statement))
    print("KMS file metadata columns are ready.")


if __name__ == "__main__":
    main()
