import logging
import time

import httpx

from app.core.config import Settings

log = logging.getLogger("originlens.currency")
_cache: dict[str, tuple[float, float]] = {}
TTL_S = 12 * 3600


def usd_to_inr(settings: Settings, transport: httpx.BaseTransport | None = None) -> tuple[float, str]:
    """Live USD→INR rate cached for 12h; falls back to the configured rate on any failure."""
    hit = _cache.get("INR")
    if hit and time.time() - hit[1] < TTL_S:
        return hit[0], "live"
    if settings.fx_api_url:
        try:
            with httpx.Client(timeout=3, transport=transport) as client:
                rate = float(client.get(settings.fx_api_url).json()["rates"]["INR"])
            if 10 < rate < 1000:  # sanity bound against a bad feed
                _cache["INR"] = (rate, time.time())
                return rate, "live"
        except Exception:
            log.warning("fx_rate_fetch_failed")
    return settings.usd_inr_fallback_rate, "fallback"
