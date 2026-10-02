"""ORM models. IDs are short strings so they match the frontend's
localStorage shapes ("c_1736...", "j_1736...") on either storage backend."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: _id("u"))
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    email: Mapped[str] = mapped_column(String(320), default="")
    phone: Mapped[str] = mapped_column(String(40), default="")
    blood_group: Mapped[str] = mapped_column(String(10), default="")
    allergies: Mapped[str] = mapped_column(Text, default="")
    emergency_notes: Mapped[str] = mapped_column(Text, default="")
    night_safety_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_share_after_9pm: Mapped[bool] = mapped_column(Boolean, default=True)
    vibrate_in_risk_zones: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_check_in_mins: Mapped[int] = mapped_column(Integer, default=15)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="Contact.created_at.desc()"
    )
    journeys: Mapped[list["Journey"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="Journey.start_time.desc()"
    )
    sos_events: Mapped[list["SOSEvent"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", order_by="SOSEvent.timestamp.desc()"
    )


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: _id("c"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(40))
    relationship_label: Mapped[str] = mapped_column("relationship", String(100), default="Family")
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_on_start: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_color: Mapped[str] = mapped_column(String(50), default="bg-primary-500")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped[User] = relationship(back_populates="contacts")


class Journey(Base):
    __tablename__ = "journeys"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: _id("j"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    share_token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, default=lambda: f"safe_{uuid.uuid4().hex[:10]}"
    )
    origin: Mapped[str] = mapped_column(String(300))
    destination: Mapped[str] = mapped_column(String(300))
    origin_lat: Mapped[float] = mapped_column(Float, default=28.6139)
    origin_lng: Mapped[float] = mapped_column(Float, default=77.2090)
    dest_lat: Mapped[float] = mapped_column(Float, default=28.6289)
    dest_lng: Mapped[float] = mapped_column(Float, default=77.2190)
    current_lat: Mapped[float] = mapped_column(Float, default=28.6139)
    current_lng: Mapped[float] = mapped_column(Float, default=77.2090)
    mode: Mapped[str] = mapped_column(String(20), default="walk")
    route_title: Mapped[str] = mapped_column(String(200), default="Safest Well-Lit Route")
    safety_score: Mapped[int] = mapped_column(Integer, default=92)
    distance_km: Mapped[float] = mapped_column(Float, default=3.2)
    duration_mins: Mapped[int] = mapped_column(Integer, default=24)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped[User] = relationship(back_populates="journeys")
    pings: Mapped[list["LocationPing"]] = relationship(
        back_populates="journey", cascade="all, delete-orphan", order_by="LocationPing.created_at"
    )


class LocationPing(Base):
    """One location update / check-in along a journey."""

    __tablename__ = "location_pings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    journey_id: Mapped[str] = mapped_column(ForeignKey("journeys.id", ondelete="CASCADE"), index=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    journey: Mapped[Journey] = relationship(back_populates="pings")


class SOSEvent(Base):
    __tablename__ = "sos_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: _id("sos"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    journey_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    location: Mapped[str] = mapped_column(String(400), default="Current GPS Coordinates")
    lat: Mapped[float] = mapped_column(Float, default=28.6139)
    lng: Mapped[float] = mapped_column(Float, default=77.2090)
    alert_sent_to: Mapped[str] = mapped_column(String(400), default="Emergency Contacts")
    battery_level: Mapped[str] = mapped_column(String(10), default="84%")
    status: Mapped[str] = mapped_column(String(50), default="Alert Dispatched")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped[User] = relationship(back_populates="sos_events")
