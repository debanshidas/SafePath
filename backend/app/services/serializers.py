"""ORM -> response-schema conversion for shapes the ORM cannot express directly
(coordinate pairs stored as separate columns, check-ins derived from pings)."""

from ..models import Journey, SOSEvent
from ..schemas import CheckIn, JourneyOut, SOSOut
from ..schemas.schemas import as_utc_iso


def journey_out(journey: Journey) -> JourneyOut:
    # `time` is a UTC ISO instant; the client renders it in the viewer's timezone.
    check_ins = [
        CheckIn(time=as_utc_iso(p.created_at), message=p.message)
        for p in journey.pings
        if p.message
    ]
    return JourneyOut(
        id=journey.id,
        share_token=journey.share_token,
        origin=journey.origin,
        destination=journey.destination,
        origin_coords=[journey.origin_lat, journey.origin_lng],
        dest_coords=[journey.dest_lat, journey.dest_lng],
        current_coords=[journey.current_lat, journey.current_lng],
        mode=journey.mode,
        route_title=journey.route_title,
        safety_score=journey.safety_score,
        distance_km=journey.distance_km,
        duration_mins=journey.duration_mins,
        status=journey.status,
        progress=journey.progress,
        start_time=journey.start_time,
        end_time=journey.end_time,
        last_updated=journey.last_updated,
        check_ins=check_ins,
    )


def sos_out(event: SOSEvent) -> SOSOut:
    return SOSOut(
        id=event.id,
        timestamp=event.timestamp,
        location=event.location,
        coords=[event.lat, event.lng],
        alert_sent_to=event.alert_sent_to,
        battery_level=event.battery_level,
        status=event.status,
        delivery_status=event.delivery_status,
        delivered_count=event.delivered_count,
        recipient_count=event.recipient_count,
    )
