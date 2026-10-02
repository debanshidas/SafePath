from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Contact, SOSEvent, User
from ..schemas import SOSCreate, SOSOut
from ..services.serializers import sos_out
from ..utils.auth import current_user

router = APIRouter(prefix="/sos", tags=["sos"])


@router.post("", response_model=SOSOut, status_code=201)
def trigger_sos(
    payload: SOSCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Record an SOS alert and resolve who it was dispatched to.

    This does NOT contact police or emergency services.
    """
    contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user.id)
        .order_by(Contact.is_primary.desc(), Contact.created_at.desc())
        .all()
    )
    primary = next((c for c in contacts if c.is_primary), contacts[0] if contacts else None)
    coords = payload.coords or [28.6139, 77.2090]

    event = SOSEvent(
        user_id=user.id,
        journey_id=payload.journey_id,
        location=payload.location,
        lat=coords[0],
        lng=coords[1],
        alert_sent_to=(f"{primary.name} ({primary.phone})" if primary else "Emergency Contacts"),
        battery_level=payload.battery_level,
        status="Alert Dispatched",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return sos_out(event)


@router.get("", response_model=list[SOSOut])
def sos_history(user: User = Depends(current_user), db: Session = Depends(get_db)):
    events = (
        db.query(SOSEvent)
        .filter(SOSEvent.user_id == user.id)
        .order_by(SOSEvent.timestamp.desc())
        .all()
    )
    return [sos_out(e) for e in events]
