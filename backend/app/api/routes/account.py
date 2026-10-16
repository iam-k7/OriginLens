import math

import redis
from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool

from app.core.config import Settings, get_settings
from app.core.ratelimit import get_redis, quota_usage
from app.core.security import Principal, get_principal, require_user
from app.services import currency

router = APIRouter(tags=["account"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/pricing")
async def pricing(settings: Settings = Depends(get_settings)):
    rate, source = await run_in_threadpool(currency.usd_to_inr, settings)
    q = settings.quotas

    def plan(pid: str, name: str, usd: float, blurb: str) -> dict:
        return {"id": pid, "name": name, "description": blurb,
                "price": {"USD": usd, "INR": math.ceil(usd * rate)},
                "limits_per_day": q.get(pid, {})}

    return {
        "currency": {"usd_inr_rate": round(rate, 2), "rate_source": source},
        "plans": [
            plan("free", "Free", 0, "For occasional checks and privacy cleanups."),
            plan("pro", "Pro", settings.pro_price_usd, "For creators, journalists and teams who verify daily."),
        ],
        "anonymous_limits_per_day": q.get("anonymous", {}),
    }


@router.get("/me")
def me(principal: Principal = Depends(require_user), settings: Settings = Depends(get_settings),
       r: redis.Redis = Depends(get_redis)):
    return {"id": principal.user_id, "email": principal.email, "plan": principal.plan,
            "usage_today": quota_usage(principal, settings, r)}


@router.get("/usage")
def usage(principal: Principal = Depends(get_principal), settings: Settings = Depends(get_settings),
          r: redis.Redis = Depends(get_redis)):
    return {"plan": principal.plan, "usage_today": quota_usage(principal, settings, r)}
