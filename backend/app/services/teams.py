from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.team_seed import INITIAL_TEAMS
from backend.app.models.team import Team


def list_teams(db: Session) -> list[Team]:
    return list(db.scalars(select(Team).order_by(Team.name)).all())


def seed_initial_teams(db: Session) -> None:
    for item in INITIAL_TEAMS:
        team = db.get(Team, item["id"])
        if team:
            team.name = item["name"]
            team.slug = item["slug"]
        else:
            db.add(Team(**item))
