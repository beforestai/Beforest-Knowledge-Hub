from fastapi import APIRouter, HTTPException, status
from httpx import HTTPError

from backend.app.schemas.collective import CollectiveOverviewRequest, CollectiveOverviewResponse
from backend.app.services.collective_overview import generate_collective_overview

router = APIRouter(prefix="/collective", tags=["collective"])


@router.post("/overview", response_model=CollectiveOverviewResponse)
def generate_collective_overview_endpoint(payload: CollectiveOverviewRequest) -> CollectiveOverviewResponse:
    try:
        overview = generate_collective_overview(payload.name, payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not read the source webpage.") from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return CollectiveOverviewResponse(overview=overview, source_url=payload.url)
