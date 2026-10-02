"""Request authentication.

If a Firebase service account file is configured, Bearer tokens are verified
with the Firebase Admin SDK. Without one — the default for local development
and the demo build — requests resolve to a single shared demo user so every
endpoint stays usable.
"""

import logging

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..services.seed import seed_demo_contacts

log = logging.getLogger("safepath.auth")

_firebase_ready: bool | None = None


def _init_firebase() -> bool:
    """Initialise firebase_admin once; return whether verification is available."""
    global _firebase_ready
    if _firebase_ready is not None:
        return _firebase_ready

    cred_file = settings.firebase_credentials_file
    if cred_file is None:
        log.info("No Firebase service account found — running in open demo mode.")
        _firebase_ready = False
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(str(cred_file)))
        _firebase_ready = True
    except Exception as exc:  # pragma: no cover - depends on local credentials
        log.warning("Firebase Admin init failed (%s) — falling back to demo mode.", exc)
        _firebase_ready = False
    return _firebase_ready


def _verify_token(token: str) -> dict | None:
    if not _init_firebase():
        return None
    try:
        from firebase_admin import auth as fb_auth

        return fb_auth.verify_id_token(token)
    except Exception as exc:
        log.warning("Rejected Firebase ID token: %s", exc)
        return None


def get_or_create_user(db: Session, firebase_uid: str, name: str = "", email: str = "") -> User:
    user = db.query(User).filter(User.firebase_uid == firebase_uid).one_or_none()
    if user:
        # Keep the profile in step with the identity provider.
        changed = False
        if name and user.name != name:
            user.name, changed = name, True
        if email and user.email != email:
            user.email, changed = email, True
        if changed:
            db.commit()
        return user

    user = User(firebase_uid=firebase_uid, name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    seed_demo_contacts(db, user)
    return user


def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the caller. Never 401s in demo mode so the UI stays functional."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        claims = _verify_token(token)
        if claims:
            return get_or_create_user(
                db,
                claims["uid"],
                claims.get("name", "") or "",
                claims.get("email", "") or "",
            )
        if _init_firebase():
            # Firebase is configured, so a bad token is a real error.
            raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    return get_or_create_user(
        db, settings.demo_user_uid, settings.demo_user_name, settings.demo_user_email
    )
