from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Contact, User
from ..schemas import ContactCreate, ContactOut, ContactUpdate
from ..utils.auth import current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])

PALETTE = ["bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"]


def _owned(db: Session, user: User, contact_id: str) -> Contact:
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.user_id == user.id)
        .one_or_none()
    )
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


def _demote_others(db: Session, user: User, keep_id: str) -> None:
    db.query(Contact).filter(Contact.user_id == user.id, Contact.id != keep_id).update(
        {Contact.is_primary: False}
    )


def _ensure_one_primary(db: Session, user: User) -> None:
    """Exactly one contact must be primary — SOS alerts target it first."""
    remaining = db.query(Contact).filter(Contact.user_id == user.id).all()
    if remaining and not any(c.is_primary for c in remaining):
        remaining[0].is_primary = True
        db.commit()


@router.get("", response_model=list[ContactOut])
def list_contacts(user: User = Depends(current_user), db: Session = Depends(get_db)):
    contacts = (
        db.query(Contact)
        .filter(Contact.user_id == user.id)
        .order_by(Contact.is_primary.desc(), Contact.created_at.desc())
        .all()
    )
    return [ContactOut.model_validate(c) for c in contacts]


@router.post("", response_model=list[ContactOut], status_code=201)
def create_contact(
    payload: ContactCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Contact).filter(Contact.user_id == user.id).count()
    contact = Contact(
        user_id=user.id,
        name=payload.name,
        phone=payload.phone,
        relationship_label=payload.relationship,
        notify_on_start=payload.notify_on_start,
        # The first contact is always primary.
        is_primary=payload.is_primary or existing == 0,
        avatar_color=payload.avatar_color or PALETTE[existing % len(PALETTE)],
    )
    db.add(contact)
    db.commit()
    if contact.is_primary:
        _demote_others(db, user, contact.id)
        db.commit()
    return list_contacts(user, db)


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    payload: ContactUpdate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    contact = _owned(db, user, contact_id)
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "relationship" in data:
        data["relationship_label"] = data.pop("relationship")
    for field, value in data.items():
        setattr(contact, field, value)
    db.commit()
    if contact.is_primary:
        _demote_others(db, user, contact.id)
        db.commit()
    db.refresh(contact)
    return ContactOut.model_validate(contact)


@router.patch("/{contact_id}/primary", response_model=list[ContactOut])
def set_primary(
    contact_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    contact = _owned(db, user, contact_id)
    contact.is_primary = True
    _demote_others(db, user, contact.id)
    db.commit()
    return list_contacts(user, db)


@router.delete("/{contact_id}", response_model=list[ContactOut])
def delete_contact(
    contact_id: str,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    contact = _owned(db, user, contact_id)
    db.delete(contact)
    db.commit()
    _ensure_one_primary(db, user)
    return list_contacts(user, db)
