import uuid

from sqlalchemy import text

from backend.app.core.team_seed import DEFAULT_USER, INITIAL_TEAMS, team_id_from_name
from backend.app.db.session import engine


def quote(value: str) -> str:
    return value.replace("'", "''")


def main() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS teams (
                    id VARCHAR(120) PRIMARY KEY,
                    name VARCHAR(120) NOT NULL,
                    slug VARCHAR(120) NOT NULL UNIQUE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                )
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    team_id VARCHAR(120) NOT NULL REFERENCES teams(id),
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                )
                """
            )
        )

        for team in INITIAL_TEAMS:
            connection.execute(
                text(
                    f"""
                    INSERT INTO teams (id, name, slug)
                    VALUES ('{quote(team["id"])}', '{quote(team["name"])}', '{quote(team["slug"])}')
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        slug = EXCLUDED.slug,
                        updated_at = now()
                    """
                )
            )

        connection.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS team_id VARCHAR(120)"))

        for team in INITIAL_TEAMS:
            connection.execute(
                text(
                    f"""
                    UPDATE documents
                    SET team_id = '{quote(team["id"])}'
                    WHERE team = '{quote(team["name"])}'
                      AND (team_id IS NULL OR team_id = '')
                    """
                )
            )

        connection.execute(
            text(
                f"""
                UPDATE documents
                SET team_id = trim(both '-' from lower(regexp_replace(replace(team, '&', 'and'), '[^a-zA-Z0-9]+', '-', 'g')))
                WHERE team_id IS NULL OR team_id = ''
                """
            )
        )

        unknown_team_ids = connection.execute(
            text(
                """
                SELECT DISTINCT team_id, team
                FROM documents
                WHERE team_id NOT IN (SELECT id FROM teams)
                """
            )
        ).all()
        for team_id, team_name in unknown_team_ids:
            slug = team_id or team_id_from_name(team_name)
            connection.execute(
                text(
                    f"""
                    INSERT INTO teams (id, name, slug)
                    VALUES ('{quote(slug)}', '{quote(team_name)}', '{quote(slug)}')
                    ON CONFLICT (id) DO NOTHING
                    """
                )
            )

        connection.execute(
            text(
                f"""
                INSERT INTO users (id, name, email, team_id)
                VALUES ('{uuid.uuid4()}', '{quote(DEFAULT_USER["name"])}', '{quote(DEFAULT_USER["email"])}', '{quote(DEFAULT_USER["team_id"])}')
                ON CONFLICT (email) DO UPDATE
                SET name = EXCLUDED.name,
                    team_id = EXCLUDED.team_id,
                    updated_at = now()
                """
            )
        )

        connection.execute(text("ALTER TABLE documents ALTER COLUMN team_id SET NOT NULL"))
        connection.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'fk_documents_team_id'
                    ) THEN
                        ALTER TABLE documents
                        ADD CONSTRAINT fk_documents_team_id
                        FOREIGN KEY (team_id) REFERENCES teams(id);
                    END IF;
                END
                $$;
                """
            )
        )
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_documents_team_id ON documents(team_id)"))

    print("KMS team ownership tables, seed data, and document team_id migration are ready.")


if __name__ == "__main__":
    main()
