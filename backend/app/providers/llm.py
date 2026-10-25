"""LLM provider layer: NVIDIA first, then OpenRouter, then Groq (each only if its key is set).

All expose the OpenAI chat-completions API, so one client class serves them all.
Adds per-call timeouts, bounded retries with backoff, a per-provider circuit breaker,
normalized errors and usage reporting.
"""
import logging
import time
from collections.abc import Callable
from dataclasses import dataclass, field

import httpx

from app.core.config import Settings
from app.core.errors import AppError

log = logging.getLogger("originlens.llm")
RETRYABLE = {408, 409, 425, 429, 500, 502, 503, 504}


@dataclass
class LLMResult:
    text: str
    provider: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: int


@dataclass
class ProviderError(Exception):
    code: str
    retryable: bool


@dataclass
class CircuitBreaker:
    # shortcut: in-process state, so each API worker trips independently; move to Redis if you scale out.
    threshold: int
    cooldown_s: float
    failures: int = 0
    opened_at: float | None = None

    def allow(self) -> bool:
        if self.opened_at is None:
            return True
        if time.monotonic() - self.opened_at >= self.cooldown_s:
            return True  # half-open: let one call probe the provider
        return False

    def record(self, ok: bool) -> None:
        if ok:
            self.failures, self.opened_at = 0, None
            return
        self.failures += 1
        if self.failures >= self.threshold:
            self.opened_at = time.monotonic()


@dataclass
class ChatProvider:
    name: str
    base_url: str
    api_key: str
    model: str
    timeout_s: float
    breaker: CircuitBreaker
    transport: httpx.BaseTransport | None = field(default=None, repr=False)

    def complete(self, messages: list[dict], temperature: float, max_tokens: int) -> LLMResult:
        start = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout_s, transport=self.transport) as client:
                resp = client.post(f"{self.base_url}/chat/completions",
                                   headers={"Authorization": f"Bearer {self.api_key}"},
                                   json={"model": self.model, "messages": messages,
                                         "temperature": temperature, "max_tokens": max_tokens})
        except httpx.TimeoutException as exc:
            raise ProviderError("timeout", True) from exc
        except httpx.HTTPError as exc:
            raise ProviderError("network_error", True) from exc
        if resp.status_code != 200:
            raise ProviderError(f"http_{resp.status_code}", resp.status_code in RETRYABLE)
        try:
            body = resp.json()
            text = body["choices"][0]["message"]["content"] or ""
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ProviderError("bad_response", True) from exc
        usage = body.get("usage") or {}
        return LLMResult(text.strip(), self.name, self.model, int(usage.get("prompt_tokens") or 0),
                         int(usage.get("completion_tokens") or 0), int((time.perf_counter() - start) * 1000))


class LLMRouter:
    def __init__(self, providers: list[ChatProvider], max_retries: int,
                 on_usage: Callable[[dict], None] | None = None, sleep: Callable[[float], None] = time.sleep):
        self.providers, self.max_retries, self.on_usage, self.sleep = providers, max_retries, on_usage, sleep

    def complete(self, messages: list[dict], temperature: float = 0.4, max_tokens: int = 1500) -> LLMResult:
        if not self.providers:
            raise AppError(503, "llm_not_configured", "AI writing features are not configured on this server")
        for p in self.providers:
            if not p.breaker.allow():
                continue
            for attempt in range(self.max_retries + 1):
                try:
                    result = p.complete(messages, temperature, max_tokens)
                except ProviderError as err:
                    p.breaker.record(False)
                    self._usage(p, False, err.code)
                    log.warning("llm_call_failed", extra={"fields": {"provider": p.name, "code": err.code,
                                                                      "attempt": attempt}})
                    if not err.retryable or not p.breaker.allow():
                        break
                    if attempt < self.max_retries:
                        self.sleep(min(0.5 * 2 ** attempt, 4))
                    continue
                p.breaker.record(True)
                self._usage(p, True, None, result)
                return result
        raise AppError(503, "llm_unavailable", "AI service is temporarily unavailable. Please try again shortly.")

    def _usage(self, p: ChatProvider, ok: bool, code: str | None, r: LLMResult | None = None) -> None:
        if self.on_usage:
            self.on_usage({"provider": p.name, "model": p.model, "success": ok, "error_code": code,
                           "prompt_tokens": r.prompt_tokens if r else 0,
                           "completion_tokens": r.completion_tokens if r else 0,
                           "latency_ms": r.latency_ms if r else 0})


_breakers: dict[str, CircuitBreaker] = {}


def build_providers(s: Settings) -> list[ChatProvider]:
    configs = [("nvidia", s.nvidia_base_url, s.nvidia_api_key, s.nvidia_model),
               ("openrouter", s.openrouter_base_url, s.openrouter_api_key, s.openrouter_model),
               ("groq", s.groq_base_url, s.groq_api_key, s.groq_model)]
    out = []
    for name, url, key, model in configs:
        if key:
            breaker = _breakers.setdefault(name, CircuitBreaker(s.llm_breaker_failures, s.llm_breaker_cooldown_s))
            out.append(ChatProvider(name, url.rstrip("/"), key, model, s.llm_timeout_s, breaker))
    return out
