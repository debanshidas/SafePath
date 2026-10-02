"""First-run seed data.

The React client ships demo contacts in localStorage. New server-side accounts
get the same set so the UI looks identical whether or not the API is reachable.
"""

from sqlalchemy.orm import Session

from ..models import Contact, User

DEMO_CONTACTS = [
    ("Aarti Sharma", "Mother", "+91 98765 43210", True, True, "bg-emerald-500"),
    ("Rohan Sharma", "Brother", "+91 98123 45678", False, True, "bg-indigo-500"),
    ("Ananya Sen", "Friend / Roommate", "+91 97654 32109", False, False, "bg-purple-500"),
]


def seed_demo_contacts(db: Session, user: User) -> bool:
    """Add the demo contacts if the user has none. Returns True if seeded."""
    if db.query(Contact).filter(Contact.user_id == user.id).count() > 0:
        return False

    for name, rel, phone, primary, notify, color in DEMO_CONTACTS:
        db.add(
            Contact(
                user_id=user.id,
                name=name,
                relationship_label=rel,
                phone=phone,
                is_primary=primary,
                notify_on_start=notify,
                avatar_color=color,
            )
        )
    db.commit()
    return True
