# ─────────────────────────────────────────────────────────────────────────
# OriginLens — Backend (FastAPI) Dockerfile
# Skeleton for Phase 1. Real implementation lands in later phases.
# ─────────────────────────────────────────────────────────────────────────

FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for Pillow, c2pa-python, pyexiv2 — pinned in later phases
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libtiff-dev \
    libexif-dev \
    exiftool \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Dependencies first (better layer caching)
COPY apps/backend/pyproject.toml /app/pyproject.toml
RUN pip install --upgrade pip && pip install -e .

# App code
COPY apps/backend /app

EXPOSE 8000

# Phase 1 placeholder; replaced in Phase 3 once FastAPI app exists
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
