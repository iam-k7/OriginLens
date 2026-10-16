import time
from functools import lru_cache

import redis
from fastapi import Depends, Request

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import Principal, client_ip, get_principal


@lru_cache
def get_redis() -> redis.Redis:
    s = get_settings()
    return redis.Redis.from_url(s.redis_url, socket_timeout=2, socket_connect_timeout=2)


def _incr(r: redis.Redis, key: str, ttl: int) -> int:
    # Fail closed: without Redis we cannot enforce limits, and LLM calls cost money.
    try:
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, ttl, nx=True)
        return int(pipe.execute()[0])
    except redis.RedisError as exc:
        raise AppError(503, "limiter_unavailable", "Service temporarily unavailable") from exc


def rate_limit(request: Request, settings: Settings = Depends(get_settings),
               r: redis.Redis = Depends(get_redis)) -> None:
    window = int(time.time() // 60)
    count = _incr(r, f"rl:{client_ip(request, settings)}:{window}", 120)
    if count > settings.rate_limit_per_minute:
        raise AppError(429, "rate_limited", "Too many requests. Please slow down.")


def quota(feature: str):
    """Dependency factory: consumes one unit of `feature` from the caller's daily quota."""
    def _consume(principal: Principal = Depends(get_principal), settings: Settings = Depends(get_settings),
                 r: redis.Redis = Depends(get_redis)) -> Principal:
        limit = settings.quotas.get(principal.plan, {}).get(feature, 0)
        used = _incr(r, f"quota:{feature}:{principal.subject}:{time.strftime('%Y%m%d', time.gmtime())}", 172800)
        if used > limit:
            raise AppError(429, "quota_exceeded", f"Daily {feature} limit reached for the {principal.plan} plan",
                           {"limit": limit, "plan": principal.plan})
        return principal
    return _consume


def quota_usage(principal: Principal, settings: Settings, r: redis.Redis) -> dict[str, dict[str, int]]:
    day = time.strftime("%Y%m%d", time.gmtime())
    limits = settings.quotas.get(principal.plan, {})
    out = {}
    for feature, limit in limits.items():
        try:
            used = int(r.get(f"quota:{feature}:{principal.subject}:{day}") or 0)
        except redis.RedisError:
            used = 0
        out[feature] = {"used": min(used, limit), "limit": limit}
    return out
