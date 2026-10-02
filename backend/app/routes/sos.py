from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Contact, Journey, SOSEvent, User
from ..schemas import Delivery, NotificationStatus, SOSCreate, SOSOut
from ..services import notifications
from ..services.serializers import sos_out
from ..utils.auth import current_user

router = APIRouter(prefix="/sos", tags=["sos"])


def _roll_up(results: list[notifications.DeliveryResult], recipients: int) -> str:
    """Summarise per-recipient outcomes into one honest status."""
    if recipients == 0:
        return "no_contacts"
    sent = sum(1 for r in results if r.ok)
    if sent == recipients:
        return "sent"
    if sent > 0:
        return "partial"
    if all(r.status == "not_configured" for r in results):
        return "not_configured"
    return "failed"


@router.post("", response_model=SOSOut, status_code=201)
def trigger_sos(
    payload: SOSCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Record an SOS alert and text the user's emergency contacts.

    This does NOT contact police or emergency services. The response reports
    exactly what was delivered, so the UI can avoid claiming otherwise.
    """
    contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user.id)
        .order_by(Contact.is_primary.desc(), Contact.created_at.desc())
        .all()
    )
    primary = next((c for c in contacts if c.is_primary), contacts[0] if contacts else None)
    coords = payload.coords or [28.6139, 77.2090]

    # Prefer the live journey's share token so contacts get real tracking.
    share_token = None
    journey = (
        db.query(Journey)
        .filter(Journey.user_id == user.id, Journey.status == "active")
        .order_by(Journey.start_time.desc())
        .first()
    )
    if journey:
        share_token = journey.share_token

    targets = contacts if settings.sos_notify_all_contacts else ([primary] if primary else [])
    body = notifications.sos_message(
        user_name=user.name or "A SafePath user",
        location=payload.location,
        share_token=share_token,
        battery=payload.battery_level,
    )
    results = notifications.send_bulk([c.phone for c in targets], body)
    delivery_status = _roll_up(results, len(targets))

    event = SOSEvent(
        user_id=user.id,
        journey_id=payload.journey_id or (journey.id if journey else None),
        location=payload.location,
        lat=coords[0],
        lng=coords[1],
        alert_sent_to=(f"{primary.name} ({primary.phone})" if primary else "No emergency contacts"),
        battery_level=payload.battery_level,
        status="Alert Dispatched" if delivery_status in ("sent", "partial") else "Alert Recorded",
        delivery_status=delivery_status,
        delivered_count=sum(1 for r in results if r.ok),
        recipient_count=len(targets),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    out = sos_out(event)
    out.deliveries = [Delivery(**r.as_dict()) for r in results]
    return out


@router.get("", response_model=list[SOSOut])
def sos_history(user: User = Depends(current_user), db: Session = Depends(get_db)):
    events = (
        db.query(SOSEvent)
        .filter(SOSEvent.user_id == user.id)
        .order_by(SOSEvent.timestamp.desc())
        .all()
    )
    return [sos_out(e) for e in events]


@router.get("/status", response_model=NotificationStatus)
def sms_status():
    """Whether outbound SMS is live, so the UI can label itself truthfully."""
    return NotificationStatus(**notifications.status())
