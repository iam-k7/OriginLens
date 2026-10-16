import json
import time
from typing import Literal

import redis
from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.ratelimit import get_redis, quota
from app.core.security import Principal
from app.db.session import get_db
from app.prompts import text as prompts
from app.providers.llm import LLMRouter, build_providers
from app.repositories import accounts
from app.services import text_analysis

router = APIRouter(prefix="/text", tags=["text"])


class TextIn(BaseModel):
    text: str = Field(min_length=1)

    @field_validator("text")
    @classmethod
    def _limit(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Text is empty")
        if len(v) > get_settings().max_text_chars:
            raise ValueError(f"Text must be at most {get_settings().max_text_chars} characters")
        return v


class AnalyzeIn(TextIn):
    mode: Literal["standard", "deep"] = "standard"


class RewriteIn(TextIn):
    tone: Literal["neutral", "friendly", "formal", "concise", "academic"] = "neutral"


def get_llm(principal: Principal, db: Session, settings: Settings) -> LLMRouter:
    return LLMRouter(build_providers(settings), settings.llm_max_retries,
                     on_usage=lambda u: accounts.record_provider_usage(db, principal.user_id, **u))


def _parse_json(raw: str) -> dict:
    start, end = raw.find("{"), raw.rfind("}")
    try:
        data = json.loads(raw[start:end + 1]) if start >= 0 else {}
    except json.JSONDecodeError:
        data = {}
    return {k: data.get(k, []) if isinstance(data.get(k), list) else []
            for k in ("observations", "sentence_notes", "suggestions")}


@router.post("/analyze")
async def analyze(body: AnalyzeIn, principal: Principal = Depends(quota("text")),
                  db: Session = Depends(get_db), settings: Settings = Depends(get_settings),
                  r: redis.Redis = Depends(get_redis)):
    start = time.perf_counter()
    result = text_analysis.analyze(body.text)
    result["mode"] = body.mode
    if body.mode == "deep":
        # Deep Scan spends an LLM call, so it also draws from the LLM quota.
        quota("llm")(principal, settings, r)
        llm = await run_in_threadpool(
            get_llm(principal, db, settings).complete,
            [{"role": "system", "content": prompts.DEEP_SCAN_SYSTEM},
             {"role": "user", "content": prompts.wrap(body.text)}], 0.2, 900)
        result["deep_scan"] = {**_parse_json(llm.text), "provider": llm.provider, "model": llm.model,
                               "disclaimer": "Style review written by a language model. It is an opinion, "
                                             "not a detection result."}
    accounts.record_job(db, principal.user_id, f"text.analyze.{body.mode}", "ok",
                        int((time.perf_counter() - start) * 1000))
    return result


@router.post("/rewrite")
async def rewrite(body: RewriteIn, principal: Principal = Depends(quota("llm")),
                  db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    start = time.perf_counter()
    try:
        llm = await run_in_threadpool(
            get_llm(principal, db, settings).complete,
            [{"role": "system", "content": prompts.REWRITE_SYSTEM.format(tone=prompts.TONES[body.tone])},
             {"role": "user", "content": prompts.wrap(body.text)}], 0.6, min(4000, len(body.text) // 2 + 400))
    except AppError as exc:
        accounts.record_job(db, principal.user_id, "text.rewrite", "failed",
                            int((time.perf_counter() - start) * 1000), exc.code)
        raise
    accounts.record_job(db, principal.user_id, "text.rewrite", "ok", int((time.perf_counter() - start) * 1000))
    return {"text": llm.text, "tone": body.tone, "provider": llm.provider, "model": llm.model,
            "note": "Rewriting improves readability. It does not guarantee any score from AI detectors."}
