from fastapi import APIRouter, Depends

from backend.app.core.current_user import CurrentUser, get_current_user
from backend.app.schemas.user import CurrentUserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUserRead)
def get_current_user_endpoint(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUserRead:
    return CurrentUserRead(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        initials=current_user.initials,
        team_id=current_user.team_id,
        team=current_user.team,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
