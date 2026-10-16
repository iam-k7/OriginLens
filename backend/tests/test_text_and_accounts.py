import httpx
import pytest

from app.core.config import get_settings
from app.core.errors import AppError
from app.providers.llm import ChatProvider, CircuitBreaker, LLMRouter
from app.services import text_analysis
from tests.conftest import jpeg_with_gps, token

SAMPLE = ("Moreover, it is important to note that the tapestry of ideas matters. Furthermore, we must delve "
          "deeper. Additionally, the realm of thought expands. ") * 5


def test_text_signals_are_descriptive_only():
    out = text_analysis.analyze(SAMPLE)
    assert out["detector"]["score"] is None
    names = {s["name"]: s for s in out["signals"]}
    assert names["Stock phrases"]["value"] >= 3
    assert out["stats"]["sentences"] == 15


def _provider(name: str, handler, breaker=None) -> ChatProvider:
    return ChatProvider(name, "https://llm.test", "k", "m", 2, breaker or CircuitBreaker(3, 60),
                        transport=httpx.MockTransport(handler))


def _ok(req):
    return httpx.Response(200, json={"choices": [{"message": {"content": "hi"}}],
                                     "usage": {"prompt_tokens": 3, "completion_tokens": 1}})


def test_llm_falls_back_and_tracks_usage():
    usage = []
    primary = _provider("openrouter", lambda r: httpx.Response(503))
    router = LLMRouter([primary, _provider("groq", _ok)], max_retries=1, on_usage=usage.append, sleep=lambda s: None)
    res = router.complete([{"role": "user", "content": "x"}])
    assert res.provider == "groq" and res.text == "hi"
    assert [u["success"] for u in usage] == [False, False, True]


def test_llm_non_retryable_and_breaker_open():
    calls = []

    def bad(req):
        calls.append(1)
        return httpx.Response(401)

    breaker = CircuitBreaker(1, 60)
    router = LLMRouter([_provider("openrouter", bad, breaker)], max_retries=3, sleep=lambda s: None)
    with pytest.raises(AppError) as e:
        router.complete([{"role": "user", "content": "x"}])
    assert e.value.code == "llm_unavailable" and len(calls) == 1
    with pytest.raises(AppError):
        router.complete([{"role": "user", "content": "x"}])
    assert len(calls) == 1  # breaker open: provider skipped


def test_rewrite_without_providers_is_503(client):
    r = client.post("/api/text/rewrite", json={"text": "hello world"})
    assert r.status_code == 503 and r.json()["error"]["code"] == "llm_not_configured"


def test_text_analyze_validation(client):
    assert client.post("/api/text/analyze", json={"text": "   "}).status_code == 422
    big = "a" * (get_settings().max_text_chars + 1)
    r = client.post("/api/text/analyze", json={"text": big})
    assert r.status_code == 422 and big not in r.text  # input never echoed back
    assert client.post("/api/text/analyze", json={"text": SAMPLE}).status_code == 200


def test_anonymous_quota_enforced(client):
    limit = get_settings().quotas["anonymous"]["text"]
    codes = [client.post("/api/text/analyze", json={"text": "Hi there."}).status_code for _ in range(limit + 1)]
    assert codes[:limit] == [200] * limit and codes[-1] == 429


def test_auth_me_and_bad_token(client):
    assert client.get("/api/me").status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer junk"}).status_code == 401
    r = client.get("/api/me", headers={"Authorization": f"Bearer {token()}"})
    assert r.status_code == 200 and r.json()["plan"] == "free"
    r = client.post("/api/images/analyze", headers={"Authorization": f"Bearer {token()}"},
                    files={"file": ("p.jpg", jpeg_with_gps(), "image/jpeg")})
    assert r.status_code == 200
    usage = client.get("/api/me", headers={"Authorization": f"Bearer {token()}"}).json()["usage_today"]
    assert usage["image"]["used"] == 1


def test_pricing_uses_fallback_rate(client):
    body = client.get("/api/pricing").json()
    pro = next(p for p in body["plans"] if p["id"] == "pro")
    assert pro["price"]["USD"] == 6 and pro["price"]["INR"] == 504
    assert body["currency"]["rate_source"] == "fallback"
