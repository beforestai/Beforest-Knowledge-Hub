from datetime import datetime
from uuid import UUID

from backend.app.schemas.document import CamelModel


class CurrentUserRead(CamelModel):
    id: UUID
    name: str
    email: str
    initials: str
    team_id: str
    team: str
    created_at: datetime
    updated_at: datetime
