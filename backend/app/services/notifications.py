"""Outbound SMS delivery via Twilio.

Every send returns an explicit per-recipient result. When Twilio credentials
are absent, sends are reported as "not_configured" rather than quietly
succeeding -- the UI must never tell someone an emergency alert was delivered
when nothing left the server.
"""

import logging
from dataclasses import asdict, dataclass

from ..config import settings

log = logging.getLogger("safepath.notifications")

_client = None
_client_error: str | None = None


@dataclass
class DeliveryResult:
    to: str
    ok: bool
    status: str  # "sent" | "failed" | "not_configured" | "invalid_number"
    detail: str = ""
    message_id: str | None = None

    def as_dict(self) -> dict:
        return asdict(self)


def is_configured() -> bool:
    return bool(
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and settings.twilio_from_number
    )


def _get_client():
    """Build the Twilio client once. Returns None if unavailable."""
    global _client, _client_error
    if _client is not None or _client_error is not None:
        return _client
    if not is_configured():
        _client_error = "Twilio credentials are not configured"
        return None
    try:
        from twilio.rest import Client

        _client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    except Exception as exc:  # pragma: no cover - depends on local credentials
        _client_error = str(exc)
        log.warning("Twilio client init failed: %s", exc)
    return _client


def status() -> dict:
    """Describe SMS availability so the UI can label itself truthfully."""
    configured = is_configured()
    from_number = settings.twilio_from_number
    return {
        "smsConfigured": configured,
        "provider": "twilio" if configured else None,
        "fromNumber": from_number if configured else None,
        "detail": (
            "SMS alerts are live."
            if configured
            else "SMS is not configured, so alerts are recorded but not sent. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER "
            "in .env to enable delivery."
        ),
    }


def _normalise(phone: str) -> str:
    """Twilio needs E.164 (+<country><number>); the UI stores spaced numbers."""
    cleaned = "".join(ch for ch in (phone or "") if ch.isdigit() or ch == "+")
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
    if not cleaned.startswith("+") and settings.default_country_code:
        cleaned = settings.default_country_code + cleaned.lstrip("0")
    return cleaned


def send_sms(to: str, body: str) -> DeliveryResult:
    """Send one SMS. Never raises -- failures come back as a result."""
    number = _normalise(to)
    if not number.startswith("+") or len(number) < 8:
        return DeliveryResult(to=to, ok=False, status="invalid_number", detail="Not a valid E.164 number")

    client = _get_client()
    if client is None:
        return DeliveryResult(
            to=number, ok=False, status="not_configured", detail=_client_error or "SMS is not configured"
        )

    try:
        message = client.messages.create(to=number, from_=settings.twilio_from_number, body=body)
        log.info("SMS queued to %s (sid=%s)", number, message.sid)
        return DeliveryResult(to=number, ok=True, status="sent", message_id=message.sid)
    except Exception as exc:
        log.error("SMS to %s failed: %s", number, exc)
        return DeliveryResult(to=number, ok=False, status="failed", detail=str(exc))


def send_bulk(recipients: list[str], body: str) -> list[DeliveryResult]:
    return [send_sms(number, body) for number in recipients]


# ---- Message templates ----


def share_url(share_token: str | None) -> str:
    if not share_token:
        return f"{settings.public_app_url}/dashboard"
    return f"{settings.public_app_url}/share/{share_token}"


def sos_message(
    user_name: str, location: str, share_token: str | None, battery: str
) -> str:
    return (
        "SAFEPATH EMERGENCY ALERT\n\n"
        f"{user_name} triggered an SOS alert.\n\n"
        f"Location: {location}\n"
        f"Live tracking: {share_url(share_token)}\n"
        f"Battery: {battery}\n\n"
        "Please contact them immediately. In India, police emergency is 112."
    )


def journey_started_message(
    user_name: str, origin: str, destination: str, share_token: str
) -> str:
    return (
        "SAFEPATH JOURNEY STARTED\n\n"
        f"{user_name} is travelling from {origin} to {destination}.\n\n"
        f"Follow live: {share_url(share_token)}\n\n"
        "You are listed as a trusted contact for this journey."
    )


def test_message(user_name: str, contact_name: str) -> str:
    return (
        "SAFEPATH TEST ALERT\n\n"
        f"Hi {contact_name} -- this is a test from {user_name}, not a real emergency.\n\n"
        "You are set up as their SafePath emergency contact. In a real alert this "
        "message would include their live location and a tracking link."
    )
