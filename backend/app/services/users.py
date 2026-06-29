from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.team_seed import DEFAULT_USER
from backend.app.models.user import User


def seed_default_user(db: Session) -> None:
    user = db.scalar(select(User).where(User.email == DEFAULT_USER["email"]))
    if user:
        user.name = DEFAULT_USER["name"]
        user.team_id = DEFAULT_USER["team_id"]
    else:
        db.add(User(**DEFAULT_USER))
