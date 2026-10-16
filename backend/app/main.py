import logging
import time
import uuid

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import account, images, text
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import request_id_var, setup_logging
from app.core.ratelimit import rate_limit

log = logging.getLogger("originlens.http")

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cross-Origin-Resource-Policy": "same-site",
    "Cache-Control": "no-store",
}


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.log_level)
    prod = settings.env == "production"
    app = FastAPI(title="OriginLens API", version="0.1.0",
                  docs_url=None if prod else "/docs", redoc_url=None, openapi_url=None if prod else "/openapi.json")
    register_error_handlers(app)

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id", "")
        rid = rid if rid.isalnum() and len(rid) <= 64 else uuid.uuid4().hex
        request.state.request_id = rid
        token = request_id_var.set(rid)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers.update(SECURITY_HEADERS)
        if prod:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        response.headers["X-Request-ID"] = rid
        # Path only: no query strings, bodies or auth headers in logs.
        log.info("request", extra={"fields": {"method": request.method, "path": request.url.path,
                                              "status": response.status_code, "request_id": rid,
                                              "ms": int((time.perf_counter() - start) * 1000)}})
        return response

    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False,
                       allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
                       expose_headers=["X-Request-ID"], max_age=600)

    api = APIRouter(prefix="/api", dependencies=[Depends(rate_limit)])
    api.include_router(images.router)
    api.include_router(text.router)
    api.include_router(account.router)
    app.include_router(api)
    return app


app = create_app()
