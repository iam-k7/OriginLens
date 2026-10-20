import base64
import time
from contextlib import contextmanager

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import Principal, get_principal
from app.db.session import get_db
from app.repositories import accounts
from app.services import ai_signals, c2pa_service, metadata, sanitize, url_fetch
from app.services.containers import REMOVABLE
from app.services.image_validation import MIME, validate_image

router = APIRouter(prefix="/images", tags=["images"])


class UrlIn(BaseModel):
    url: str = Field(max_length=2048)


@contextmanager
def _job(db: Session, principal: Principal, kind: str):
    start = time.perf_counter()
    try:
        yield
    except AppError as exc:
        accounts.record_job(db, principal.user_id, kind, "failed", int((time.perf_counter() - start) * 1000),
                            exc.code)
        raise
    accounts.record_job(db, principal.user_id, kind, "ok", int((time.perf_counter() - start) * 1000))


async def _read(file: UploadFile, settings: Settings) -> bytes:
    # Read at most limit+1 bytes so oversize uploads are rejected without buffering everything.
    data = await file.read(settings.max_upload_bytes + 1)
    await file.close()
    return data


def _analyze(data: bytes, settings: Settings) -> dict:
    fmt = validate_image(data, settings.max_upload_bytes, settings.max_image_pixels)
    return {"metadata": metadata.inspect(data, fmt), "c2pa": c2pa_service.inspect(fmt, MIME[fmt], data),
            "privacy_clean_supported": fmt in ("JPEG", "PNG", "WEBP")}


@router.post("/analyze")
async def analyze(file: UploadFile = File(...), principal: Principal = Depends(get_principal),
                  db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    data = await _read(file, settings)
    with _job(db, principal, "image.analyze"):
        return await run_in_threadpool(_analyze, data, settings)


@router.post("/analyze-url")
async def analyze_url(body: UrlIn, principal: Principal = Depends(get_principal),
                      db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with _job(db, principal, "image.analyze_url"):
        data = await run_in_threadpool(url_fetch.fetch_image, body.url, settings.max_upload_bytes,
                                       settings.url_fetch_timeout_s, settings.url_fetch_max_redirects)
        result = await run_in_threadpool(_analyze, data, settings)
        # Return the bytes so the client can preview and run AI signals / clean without re-fetching.
        fmt = result["metadata"]["technical"]["format"]
        result["image"] = {"mime_type": MIME[fmt], "base64": base64.b64encode(data).decode()}
        return result


@router.post("/ai-signals")
async def ai_signals_route(file: UploadFile = File(...), principal: Principal = Depends(get_principal),
                           db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    data = await _read(file, settings)
    with _job(db, principal, "image.ai_signals"):
        result = await run_in_threadpool(_analyze, data, settings)
        return {"ai_signals": ai_signals.analyze(result["metadata"], result["c2pa"]), "c2pa": result["c2pa"]}


@router.post("/clean")
async def clean(file: UploadFile = File(...), categories: str = Form(",".join(REMOVABLE)),
                principal: Principal = Depends(get_principal), db: Session = Depends(get_db),
                settings: Settings = Depends(get_settings)):
    data = await _read(file, settings)
    cats = [c.strip() for c in categories.split(",") if c.strip()]

    def work() -> dict:
        fmt = validate_image(data, settings.max_upload_bytes, settings.max_image_pixels)
        before = metadata.inspect(data, fmt)
        out, removed = sanitize.clean(data, fmt, cats)
        after = metadata.inspect(out, fmt)
        stem = (file.filename or "image").rsplit(".", 1)[0][:80]
        return {
            "removed": removed,
            "before": before,
            "after": after,
            "c2pa_after": c2pa_service.inspect(fmt, MIME[fmt], out),
            "file": {"filename": f"{stem}-clean.{fmt.lower().replace('jpeg', 'jpg')}",
                     "mime_type": MIME[fmt], "base64": base64.b64encode(out).decode()},
            "limitations": sanitize.LIMITATIONS,
        }

    with _job(db, principal, "image.clean"):
        return await run_in_threadpool(work)
