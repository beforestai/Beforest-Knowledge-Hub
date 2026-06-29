from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.schemas.team import TeamList
from backend.app.services.teams import list_teams

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=TeamList)
def list_teams_endpoint(db: Session = Depends(get_db)) -> TeamList:
    return TeamList(items=list_teams(db))
