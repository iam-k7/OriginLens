from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AnalysisJob, AuditEvent, ProviderUsage, Subscription, User


def ensure_user(db: Session, user_id: str, email: str | None) -> User:
    user = db.get(User, user_id)
    if user is None:
        user = User(id=user_id, email=email)
        db.add_all([user, Subscription(user_id=user_id, plan="free")])
        db.add(AuditEvent(user_id=user_id, action="user.first_seen"))
        db.commit()
    return user


def get_plan(db: Session, user_id: str) -> str:
    sub = db.scalar(select(Subscription).where(Subscription.user_id == user_id))
    return sub.plan if sub and sub.status == "active" else "free"


def record_job(db: Session, user_id: str | None, kind: str, status: str, duration_ms: int,
               error_code: str | None = None) -> None:
    db.add(AnalysisJob(user_id=user_id, kind=kind, status=status, duration_ms=duration_ms,
                       error_code=error_code))
    db.commit()


def record_provider_usage(db: Session, user_id: str | None, **fields) -> None:
    db.add(ProviderUsage(user_id=user_id, **fields))
    db.commit()
