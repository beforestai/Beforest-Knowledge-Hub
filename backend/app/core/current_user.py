from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.team_seed import DEFAULT_USER
from backend.app.db.session import get_db
from backend.app.models.team import Team
from backend.app.models.user import User


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    name: str
    email: str
    team_id: str
    team: str
    initials: str
    created_at: datetime
    updated_at: datetime


def initials_for_name(name: str) -> str:
    parts = [part for part in name.strip().split() if part]
    if not parts:
        return "U"
    return "".join(part[0].upper() for part in parts[:2])


def get_current_user(db: Session = Depends(get_db)) -> CurrentUser:
    user = db.scalar(select(User).where(User.email == DEFAULT_USER["email"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current user is not configured.")

    team = db.get(Team, user.team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Current user's team is missing.")

    return CurrentUser(
        id=user.id,
        name=user.name,
        email=user.email,
        team_id=user.team_id,
        team=team.name,
        initials=initials_for_name(user.name),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
