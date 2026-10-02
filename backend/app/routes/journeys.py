from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Contact, Journey, LocationPing, User
from ..schemas import JourneyCreate, JourneyOut, LocationUpdate
from ..services import notifications
from ..services.serializers import journey_out
from ..utils.auth import current_user

router = APIRouter(prefix="/journeys", tags=["journeys"])


def _owned(db: Session, user: User, journey_id: str) -> Journey:
    journey = (
        db.query(Journey)
        .filter(Journey.id == journey_id, Journey.user_id == user.id)
        .one_or_none()
    )
    if journey is None:
        raise HTTPException(status_code=404, detail="Journey not found")
    return journey


@router.get("", response_model=list[JourneyOut])
def my_journeys(user: User = Depends(current_user), db: Session = Depends(get_db)):
    journeys = (
        db.query(Journey)
        .filter(Journey.user_id == user.id)
        .order_by(Journey.start_time.desc())
        .all()
    )
    return [journey_out(j) for j in journeys]


# Declared before /{journey_id} so "active" is not read as an id.
@router.get("/active", response_model=JourneyOut | None)
def active_journey(user: User = Depends(current_user), db: Session = Depends(get_db)):
    journey = (
        db.query(Journey)
        .filter(Journey.user_id == user.id, Journey.status == "active")
        .order_by(Journey.start_time.desc())
        .first()
    )
    return journey_out(journey) if journey else None


@router.post("", response_model=JourneyOut, status_code=201)
def create_journey(
    payload: JourneyCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    origin_coords = payload.origin_coords or [28.6139, 77.2090]
    dest_coords = payload.dest_coords or [28.6289, 77.2190]

    journey = Journey(
        user_id=user.id,
        origin=payload.origin,
        destination=payload.destination,
        origin_lat=origin_coords[0],
        origin_lng=origin_coords[1],
        dest_lat=dest_coords[0],
        dest_lng=dest_coords[1],
        current_lat=origin_coords[0],
        current_lng=origin_coords[1],
        mode=payload.mode,
        route_title=payload.route_title,
        safety_score=payload.safety_score,
        distance_km=payload.distance_km,
        duration_mins=payload.duration_mins,
        status="active",
        progress=0,
    )
    db.add(journey)
    db.commit()

    db.add(
        LocationPing(
            journey_id=journey.id,
            lat=origin_coords[0],
            lng=origin_coords[1],
            progress=0,
            message="Journey started with live safety tracking",
        )
    )
    db.commit()
    db.refresh(journey)

    _notify_journey_start(db, user, journey)
    return journey_out(journey)


def _notify_journey_start(db: Session, user: User, journey: Journey) -> None:
    """Text contacts who opted into start-of-journey alerts. Best effort: a
    delivery failure must not prevent the journey from being tracked."""
    recipients = (
        db.query(Contact)
        .filter(Contact.user_id == user.id, Contact.notify_on_start.is_(True))
        .all()
    )
    if not recipients:
        return
    body = notifications.journey_started_message(
        user_name=user.name or "A SafePath user",
        origin=journey.origin,
        destination=journey.destination,
        share_token=journey.share_token,
    )
    notifications.send_bulk([c.phone for c in recipients], body)


@router.get("/{journey_id}", response_model=JourneyOut)
def get_journey(
    journey_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return journey_out(_owned(db, user, journey_id))


@router.patch("/{journey_id}/start", response_model=JourneyOut)
def start_journey(
    journey_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    journey = _owned(db, user, journey_id)
    journey.status = "active"
    journey.start_time = datetime.now(timezone.utc)
    journey.last_updated = journey.start_time
    db.commit()
    db.refresh(journey)
    return journey_out(journey)


@router.post("/{journey_id}/location", response_model=JourneyOut)
def post_location(
    journey_id: str,
    payload: LocationUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    journey = _owned(db, user, journey_id)
    journey.current_lat = payload.lat
    journey.current_lng = payload.lng
    journey.progress = max(0, min(100, payload.progress))
    journey.last_updated = datetime.now(timezone.utc)
    db.add(
        LocationPing(
            journey_id=journey.id,
            lat=payload.lat,
            lng=payload.lng,
            progress=journey.progress,
            message=payload.message,
        )
    )
    db.commit()
    db.refresh(journey)
    return journey_out(journey)


@router.patch("/{journey_id}/end", response_model=JourneyOut)
def end_journey(
    journey_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    journey = _owned(db, user, journey_id)
    journey.status = "completed"
    journey.progress = 100
    journey.end_time = datetime.now(timezone.utc)
    journey.last_updated = journey.end_time
    db.commit()
    db.refresh(journey)
    return journey_out(journey)


@router.patch("/{journey_id}/cancel", response_model=JourneyOut)
def cancel_journey(
    journey_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    journey = _owned(db, user, journey_id)
    journey.status = "cancelled"
    journey.end_time = datetime.now(timezone.utc)
    journey.last_updated = journey.end_time
    db.commit()
    db.refresh(journey)
    return journey_out(journey)
