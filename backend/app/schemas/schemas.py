"""Pydantic schemas. Responses are camelCase to match what the React client
already reads from localStorage, so both storage paths are interchangeable."""

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_serializer


def _camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(w.capitalize() for w in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
    )


def as_utc_iso(value: datetime | None) -> str | None:
    """SQLite returns naive datetimes; tag them UTC so `new Date(...)` in the
    browser does not read them as local time."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# ---- Auth ----
class SyncUserIn(BaseModel):
    firebase_uid: str = ""
    name: str = ""
    email: str = ""


class SyncUserOut(CamelModel):
    ok: bool = True
    user_id: str
    name: str
    email: str


# ---- Contacts ----
class ContactCreate(CamelModel):
    name: str
    phone: str
    relationship: str = "Family"
    is_primary: bool = False
    notify_on_start: bool = True
    avatar_color: str | None = None


class ContactUpdate(CamelModel):
    name: str | None = None
    phone: str | None = None
    relationship: str | None = None
    is_primary: bool | None = None
    notify_on_start: bool | None = None
    avatar_color: str | None = None


class ContactOut(CamelModel):
    id: str
    name: str
    phone: str
    relationship: str = Field(validation_alias="relationship_label")
    is_primary: bool
    notify_on_start: bool
    avatar_color: str


# ---- Journeys ----
class JourneyCreate(CamelModel):
    origin: str = "Current Location"
    destination: str = "Destination"
    origin_coords: list[float] | None = None
    dest_coords: list[float] | None = None
    mode: str = "walk"
    route_title: str = "Safest Well-Lit Route"
    safety_score: int = 92
    distance_km: float = 3.2
    duration_mins: int = 24


class CheckIn(CamelModel):
    time: str
    message: str


class JourneyOut(CamelModel):
    id: str
    share_token: str
    origin: str
    destination: str
    origin_coords: list[float]
    dest_coords: list[float]
    current_coords: list[float]
    mode: str
    route_title: str
    safety_score: int
    distance_km: float
    duration_mins: int
    status: str
    progress: int
    start_time: datetime
    end_time: datetime | None = None
    last_updated: datetime
    check_ins: list[CheckIn] = []

    @field_serializer("start_time", "end_time", "last_updated")
    def _ser_dt(self, value: datetime | None) -> str | None:
        return as_utc_iso(value)


class LocationUpdate(CamelModel):
    lat: float
    lng: float
    progress: int = 0
    message: str | None = None


# ---- Safety ----
class SafetyQuery(CamelModel):
    origin: str | None = None
    destination: str | None = None
    mode: str = "walk"
    time: str = "day"  # "day" | "night"


class SafetyFactors(CamelModel):
    lighting_score: int
    crowd_density: str
    police_booths_nearby: int
    cctv_coverage: str
    emergency_stops_count: int


class SafetyAssessment(CamelModel):
    safety_score: int
    rating: str
    factors: SafetyFactors


# ---- SOS ----
class SOSCreate(CamelModel):
    location: str = "Current GPS Coordinates"
    coords: list[float] | None = None
    journey_id: str | None = None
    battery_level: str = "84%"


class SOSOut(CamelModel):
    id: str
    timestamp: datetime
    location: str
    coords: list[float]
    alert_sent_to: str
    battery_level: str
    status: str

    @field_serializer("timestamp")
    def _ser_dt(self, value: datetime) -> str | None:
        return as_utc_iso(value)


# ---- Profile ----
class ProfileOut(CamelModel):
    name: str
    email: str
    phone: str
    blood_group: str
    allergies: str
    emergency_notes: str
    night_safety_alerts: bool
    auto_share_after9pm: bool = Field(
        validation_alias="auto_share_after_9pm", serialization_alias="autoShareAfter9PM"
    )
    vibrate_in_risk_zones: bool
    auto_check_in_mins: int


class ProfileUpdate(CamelModel):
    name: str | None = None
    phone: str | None = None
    blood_group: str | None = None
    allergies: str | None = None
    emergency_notes: str | None = None
    night_safety_alerts: bool | None = None
    auto_share_after9pm: bool | None = Field(
        default=None, validation_alias="autoShareAfter9PM", serialization_alias="autoShareAfter9PM"
    )
    vibrate_in_risk_zones: bool | None = None
    auto_check_in_mins: int | None = None
