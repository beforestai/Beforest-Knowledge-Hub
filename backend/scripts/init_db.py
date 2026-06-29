from sqlalchemy import text

from backend.app.db.session import Base, engine
from backend.app import models  # noqa: F401
from backend.app.db.session import SessionLocal
from backend.app.services.teams import seed_initial_teams
from backend.app.services.users import seed_default_user


def main() -> None:
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_initial_teams(db)
        seed_default_user(db)
        db.commit()
    print("KMS database tables created.")


if __name__ == "__main__":
    main()
