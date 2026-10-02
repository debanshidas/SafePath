from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import ProfileOut, ProfileUpdate, SyncUserIn, SyncUserOut
from ..utils.auth import current_user, get_or_create_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=SyncUserOut)
def sync_user(payload: SyncUserIn, db: Session = Depends(get_db)):
    """Upsert the signed-in Firebase user into PostgreSQL."""
    uid = payload.firebase_uid or "demo_priya_sharma"
    user = get_or_create_user(db, uid, payload.name, payload.email)
    return SyncUserOut(user_id=user.id, name=user.name, email=user.email)


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(current_user)):
    return ProfileOut.model_validate(user)


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    # The schema field is auto_share_after9pm; the column is auto_share_after_9pm.
    if "auto_share_after9pm" in data:
        data["auto_share_after_9pm"] = data.pop("auto_share_after9pm")
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return ProfileOut.model_validate(user)
