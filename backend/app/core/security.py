from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.repositories import accounts


@dataclass(frozen=True)
class Principal:
    user_id: str | None
    email: str | None
    plan: str  # "anonymous" | "free" | "pro"
    subject: str  # quota key: user id or client IP


def client_ip(request: Request, settings: Settings) -> str:
    """Trust X-Forwarded-For only for the configured number of proxy hops."""
    if settings.trusted_proxy_count > 0:
        hops = [h.strip() for h in request.headers.get("x-forwarded-for", "").split(",") if h.strip()]
        if len(hops) >= settings.trusted_proxy_count:
            return hops[-settings.trusted_proxy_count]
    return request.client.host if request.client else "unknown"


@lru_cache
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json", cache_keys=True, timeout=5)


def verify_supabase_token(token: str, settings: Settings) -> dict:
    try:
        if settings.supabase_jwt_secret:
            key, algs = settings.supabase_jwt_secret, ["HS256"]
        elif settings.supabase_url:
            key, algs = _jwks_client(settings.supabase_url).get_signing_key_from_jwt(token).key, ["RS256", "ES256"]
        else:
            raise AppError(503, "auth_not_configured", "Authentication is not configured")
        return jwt.decode(token, key, algorithms=algs, audience=settings.supabase_jwt_audience,
                          options={"require": ["exp", "sub"]})
    except jwt.PyJWTError as exc:
        raise AppError(401, "invalid_token", "Invalid or expired session") from exc


def get_principal(request: Request, db: Session = Depends(get_db),
                  settings: Settings = Depends(get_settings)) -> Principal:
    auth = request.headers.get("authorization", "")
    if not auth:
        return Principal(None, None, "anonymous", f"ip:{client_ip(request, settings)}")
    scheme, _, token = auth.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AppError(401, "invalid_token", "Invalid authorization header")
    claims = verify_supabase_token(token, settings)
    user = accounts.ensure_user(db, claims["sub"], claims.get("email"))
    return Principal(user.id, user.email, accounts.get_plan(db, user.id), f"user:{user.id}")


def require_user(principal: Principal = Depends(get_principal)) -> Principal:
    if principal.user_id is None:
        raise AppError(401, "auth_required", "Sign in to use this feature")
    return principal
