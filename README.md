# OriginLens

> **Understand where your content comes from.**

OriginLens is a privacy-first SaaS for analyzing images and text: detect
AI-generation signals, inspect metadata and provenance, run reverse-image
discovery where available, and rewrite text for clarity — without permanently
storing the files you upload.

---

## Core principles

1. **Privacy first** — uploads are processed in temporary memory; no permanent
   image or text storage by default.
2. **Free and open-source resources wherever practical** — only paid cost is
   the LLM API usage.
3. **Modular architecture** — analyzers, providers, and search backends are
   independently replaceable.
4. **Secure by default** — secrets in env vars, server-enforced quotas,
   SSRF protection, file-signature validation, secure headers.
5. **Provider abstraction** — OpenRouter (primary) and Groq (fallback); easy
   to add more.
6. **Rate limiting & graceful degradation** — Redis-backed, with provider
   failover and a friendly error envelope.
7. **Accessibility & responsive UI** — keyboard-first, screen-reader friendly,
   mobile through large desktop.
8. **Never claim AI detection is 100% accurate** — language always speaks of
   *signals*, *evidence*, *confidence*, and *conclusions*, never absolute
   proof.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18 (standalone components, hand-rolled SCSS design tokens) |
| Backend  | Python 3.10+ · FastAPI · Pydantic v2 |
| Database | PostgreSQL 16 · SQLAlchemy 2 (async) · Alembic |
| Cache & rate limit | Redis 7 |
| Background jobs | Celery + Redis |
| Reverse proxy | nginx |
| Orchestration | Docker Compose |

---

## Repository layout

```
OriginLens/
├── apps/
│   ├── backend/          FastAPI service (Python)
│   └── frontend/         Angular SPA
├── infra/
│   └── docker/           Dockerfiles, nginx config
├── docs/                 architecture.md, security.md, …
├── docker-compose.yml    one-command dev stack
├── .env.example          copy to .env; never commit real values
└── pyproject.toml        workspace marker
```

See [`docs/architecture.md`](docs/architecture.md) for the full design.

---

## Quickstart (development)

### Prerequisites

- Docker + Docker Compose
- (Optional) Python 3.10+ and Node 20+ if you want to run services outside
  containers.

### One-command stack

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add OPENROUTER_API_KEY (and/or GROQ_API_KEY)

# 2. Bring everything up
docker compose up --build
```

Once running:

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:4200        |
| Backend  | http://localhost:8000        |
| API docs | http://localhost:8000/docs   |
| Postgres | localhost:5432               |
| Redis    | localhost:6379               |

### Running the backend outside Docker (optional)

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp ../../.env.example ../../.env  # then edit
uvicorn app.main:app --reload
```

### Running the frontend outside Docker (optional)

```bash
cd apps/frontend
npm install
npm start
```

---

## Environment

All configuration comes from environment variables. See
[`.env.example`](.env.example) for the full list with documentation.

**Never commit a real `.env` file.** `.env` is in `.gitignore`.

Categories:

- **App & logging** — `APP_ENV`, `APP_LOG_LEVEL`, …
- **Database & cache** — `DATABASE_URL`, `REDIS_URL`
- **Auth** — `JWT_SECRET`, `JWT_ACCESS_TTL_SECONDS`, …
- **LLM providers** — `OPENROUTER_*`, `GROQ_*`, `LLM_PRIMARY`, `LLM_FALLBACK`
- **Rate limits & quotas** — `RATE_LIMIT_ENABLED`, `QUOTA_FREE_*`, `QUOTA_PRO_*`
- **Image limits** — `MAX_UPLOAD_BYTES`, `MAX_IMAGE_PIXELS`, `ALLOW_SVG`
- **Pricing & FX** — `PRICING_BASE_CURRENCY`, `FX_USD_TO_INR_FALLBACK`
- **Security** — `CORS_ALLOWED_ORIGINS`, `SECURE_COOKIES`, `TRUSTED_HOSTS`

---

## Development phases

| Phase | Goal |
|---|---|
| 1 | Repository & architecture (this PR) |
| 2 | Frontend shell with design tokens & routing |
| 3 | Image analyzer (upload, validation, EXIF, technical analysis) |
| 4 | Metadata sanitization |
| 5 | Text analyzer (heuristics) |
| 6 | LLM provider abstraction (OpenRouter, Groq, router) |
| 7 | Wire LLM into image & text analyzers |
| 8 | Auth (register, login, refresh, logout) |
| 9 | Subscriptions, server-enforced quotas & rate limits |
| 10 | Pricing page with currency toggle |
| 11 | Security hardening (SSRF, headers, decompression bombs, audit log) |
| 12 | Test suite: unit, integration, security |
| 13 | Production deployment (nginx, hardened Docker) |

After every phase: tests, type checks, lint, `/healthz`, route smoke test,
security review, written summary.

---

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system design, services,
  data model, provider abstraction, quotas, API surface.
- [`docs/security.md`](docs/security.md) — secrets, SSRF, file validation,
  rate limits, headers, logging, threat model.

---

## Security

OriginLens is built with privacy as a first-class concern. Highlights:

- No images, no text, no API keys, no passwords in logs.
- Server-enforced quotas and rate limits (Redis).
- SSRF protection on URL analysis (private-IP blocking, redirect cap, size cap).
- File validation by MIME and magic bytes, not by extension.
- Decompression-bomb protection (`MAX_IMAGE_PIXELS`).
- LLM responses validated with Pydantic before being trusted.
- CORS allowlisted to `FRONTEND_URL`; secure headers in nginx and FastAPI.

If you find a security issue, please report privately via GitHub Security
Advisories (link configured later).

---

## License

License to be determined. All rights reserved until then.
