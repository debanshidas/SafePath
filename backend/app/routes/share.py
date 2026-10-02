from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Journey
from ..schemas import JourneyOut
from ..services.serializers import journey_out

router = APIRouter(prefix="/share", tags=["share"])


@router.get("/{share_token}", response_model=JourneyOut)
def shared_journey(share_token: str, db: Session = Depends(get_db)):
    """Public, unauthenticated read of a journey by its share token."""
    journey = db.query(Journey).filter(Journey.share_token == share_token).one_or_none()
    if journey is None:
        raise HTTPException(status_code=404, detail="This tracking link is invalid or has expired")
    return journey_out(journey)
