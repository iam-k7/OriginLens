# OriginLens — Architecture

This document captures the system design agreed for OriginLens. It is the
canonical reference for the codebase and is updated as decisions evolve.

## 1. Goals & non-goals

**Goals**

- Privacy-first: do not permanently store uploaded images or text.
- Probabilistic AI-signal analysis with honest language (signals, not proof).
- Modular, provider-abstracted LLM usage with failover.
- Server-enforced quotas and rate limits.
- Production-grade security, accessibility, and observability.

**Non-goals (v1)**

- "100% accurate" AI detection.
- Reverse-image search with a real provider (stub-only in v1).
- Live FX rates (configured fallback only).
- Server-side payment processor integration (subscriptions modeled in DB but
  not billed in v1).
- Google OAuth / GitHub OAuth (architecture prepared, not implemented).

## 2. High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Angular SPA)                       │
│  Analyzer · Text Intelligence · Pricing · Auth                      │
│  - design tokens, accessible components                             │
│  - all secrets proxied through backend                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (JWT in Authorization header)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python 3.10)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │  Auth    │  │ Analyzer │  │  Text    │  │   Pricing/Quota  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Service layer: metadata, C2PA, EXIF, signals, sanitization  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Provider Router → OpenRouter (primary) → Groq (fallback)    │   │
│  │  Circuit breaker · retry · timeout · token tracking          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Prompt Registry (versioned, structured JSON outputs)        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────┬─────────────────────┬──────────────────┬──────────────────────┘
      │                     │                  │
      ▼                     ▼                  ▼
┌──────────┐          ┌──────────┐      ┌──────────────┐
│ Postgres │          │  Redis   │      │  Celery/     │
│ (users,  │          │ (quota,  │      │  RQ workers  │
│  subs,   │          │  rate    │      │  (deep scan, │
│  usage,  │          │  limit,  │      │   batch      │
│  audit)  │          │  cache)  │      │   jobs)      │
└──────────┘          └──────────┘      └──────────────┘
```

## 3. Repository layout

```
OriginLens/
├── apps/
│   ├── backend/                 FastAPI service
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── core/            config, security, rate_limit, logging, errors
│   │   │   ├── api/             routes, deps
│   │   │   ├── models/          SQLAlchemy ORM
│   │   │   ├── schemas/         Pydantic DTOs
│   │   │   ├── repositories/    data access
│   │   │   ├── services/        analyzer, metadata, c2pa, text, currency, quota
│   │   │   ├── providers/
│   │   │   │   └── llm/         base, openrouter, groq, router
│   │   │   ├── prompts/         versioned prompt registry
│   │   │   ├── workers/         Celery
│   │   │   └── utils/           ssrf, file validation, safe image decode
│   │   ├── tests/
│   │   └── pyproject.toml
│   └── frontend/                Angular SPA
│       └── src/
│           ├── styles/          tokens.scss, global.scss
│           └── app/
│               ├── core/        http, auth, interceptors
│               ├── shared/      reusable components
│               ├── features/    landing, analyzer, text, pricing, auth, dashboard
│               └── layout/      navbar, footer
├── infra/docker/                Dockerfiles, nginx
├── docs/                        architecture, security, api
├── docker-compose.yml
└── .env.example
```

## 4. Frontend

- **Framework**: Angular 18, standalone components, signals where useful,
  strict TypeScript.
- **Styling**: hand-rolled SCSS design tokens (`src/styles/tokens.scss`).
  No utility framework; no Material. Components consume `var(--ol-*)`.
- **State**: services with RxJS. No NgRx for v1; add if complexity demands.
- **Routing**: lazy-loaded feature components.
- **HTTP**: `HttpClient` with interceptors for JWT and normalized error
  handling.
- **Accessibility**: focus rings, `aria-*`, prefers-reduced-motion respected,
  reduced-motion CSS overrides.

### Routes

| Route       | Purpose                  |
|-------------|--------------------------|
| `/`         | Landing                  |
| `/analyzer` | Image analyzer           |
| `/text`     | Text intelligence        |
| `/pricing`  | Pricing (USD/INR toggle) |
| `/login`    | Login                    |
| `/signup`   | Sign up                  |
| `/dashboard`| Authenticated usage      |

## 5. Backend

- **Framework**: FastAPI 0.115+, async throughout.
- **Validation**: Pydantic v2 for request, response, and LLM output schemas.
- **ORM**: SQLAlchemy 2 with `asyncpg`. Alembic for migrations.
- **Auth**: JWT (HS256) with short-lived access tokens and rotating refresh
  tokens; bcrypt password hashes.
- **Logging**: `structlog` with JSON output, request IDs, allowlist of fields.
- **Error envelope**: `{ code, message, retry_after? }` for clients; internal
  details only in logs.

### API surface (v1, under `/api/v1`)

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

POST   /analyzer/image           (multipart)
POST   /analyzer/url             (json)
POST   /analyzer/sanitize        (multipart)

POST   /text/analyze
POST   /text/rewrite
POST   /text/deep-scan

GET    /pricing                  (?currency=USD|INR)
GET    /usage
GET    /healthz
GET    /readyz
```

### Image processing pipeline

```
Upload
  ↓
Validate MIME (Content-Type)
  ↓
Validate magic bytes (not the extension!)
  ↓
Validate size (<= MAX_UPLOAD_BYTES)
  ↓
Decode safely (PIL with pixel cap)
  ↓
Analyze metadata (EXIF, IPTC, XMP)
  ↓
Analyze provenance (C2PA)
  ↓
Run image-stat analysis (technical signals)
  ↓
Optionally: enrich with LLM explanation
  ↓
Generate structured result (Pydantic)
  ↓
Delete temporary file
  ↓
Return result
```

## 6. Data model (PostgreSQL)

| Table              | Purpose                                            |
|--------------------|----------------------------------------------------|
| `users`            | Account, password hash, role                       |
| `subscriptions`    | Plan, status, renewal                              |
| `usage`            | Per-user, per-month, per-metric counters           |
| `analysis_jobs`    | Audit trail (no image bytes)                       |
| `analysis_results` | Structured result JSON                             |
| `sanitization_jobs`| Audit (cleaned bytes returned, never stored)       |
| `provider_usage`   | Per-call token + cost tracking                     |
| `refresh_tokens`   | Hashed, revokable, with rotation                   |
| `audit_events`     | login, quota_exceeded, provider_failure, etc.      |

No image or text bodies are ever stored. Only hashes + metadata for audit
and quota accounting.

## 7. Provider abstraction

```python
class LLMProvider(Protocol):
    name: str
    async def analyze_text(self, req) -> TextAnalysisResult: ...
    async def rewrite_text(self, req) -> RewriteResult: ...
    async def deep_analyze(self, req) -> TextAnalysisResult: ...
    async def ping(self) -> bool: ...
```

Implementations:

- `OpenRouterProvider` — primary.
- `GroqProvider` — fallback.
- `ProviderRouter` — primary→fallback, exponential backoff, per-provider
  circuit breaker (60s window), normalized errors, token/cost tracking.

Reverse-image search:

- `ReverseSearchProvider` — interface.
- `StubReverseSearchProvider` — returns `{available: false, reason: "provider_not_configured"}`.
  v1 ships only the stub; the UI renders the empty state honestly.

## 8. Quotas and rate limits

**Two layers, both server-side:**

### Quotas (per user, per calendar month, Postgres)

| Metric                     | Free | Pro (soft cap) |
|----------------------------|------|----------------|
| image_analysis             | 10   | 10,000         |
| metadata_sanitization      | 5    | 10,000         |
| text_analysis (standard)   | 3    | 10,000         |
| text_deep_scan             | 1    | 50             |
| text_rewrite               | 3    | 10,000         |

`unlimited` is implemented as a high soft cap so abuse monitoring still works.

### Rate limits (per minute, sliding window in Redis)

| Endpoint                | Anonymous      | Free       | Pro        |
|-------------------------|----------------|------------|------------|
| `POST /analyzer/image`  | 3 / 10 min     | 10 / min   | 60 / min   |
| `POST /analyzer/url`    | 3 / 10 min     | 10 / min   | 60 / min   |
| `POST /analyzer/sanitize` | 1 / 10 min   | 5 / min    | 30 / min   |
| `POST /text/analyze`    | 1 / 10 min     | 5 / min    | 30 / min   |
| `POST /text/deep-scan`  | —              | 1 / min    | 10 / min   |
| `POST /text/rewrite`    | 1 / 10 min     | 5 / min    | 30 / min   |
| Auth endpoints          | 5 / min / IP   | —          | —          |

Exceeding either layer returns `429` with the normalized envelope.

## 9. Currencies

- Configurable USD→INR fallback rate (`FX_USD_TO_INR_FALLBACK`).
- No external FX call in v1.
- Pricing response always includes `fx_source` and `fx_updated_at` so the UI
  can label the value as approximate when it is.

## 10. Observability

- Structured JSON logs with request IDs.
- Provider latency, provider failures, analysis latency, quota usage counters.
- No image bytes, no full text, no API keys, no passwords in logs.
- `/healthz` (liveness) and `/readyz` (DB + Redis + provider ping) endpoints.

## 11. Security model

See [`docs/security.md`](security.md) for the full threat model, SSRF rules,
file validation, headers, and logging policy.

## 12. Deployment

- `docker-compose.yml` for local dev (Postgres, Redis, backend, frontend).
- Production behind nginx with TLS terminated upstream.
- CORS locked to `FRONTEND_URL`.
- Containers run as non-root where supported.
- Healthchecks wired to compose and orchestrator.

## 13. Roadmap (beyond Phase 1)

- Real reverse-image provider integration.
- Stripe / Razorpay billing.
- Google & GitHub OAuth.
- Real-time progress streaming for deep scan (SSE).
- Optional self-hosted worker pool for on-prem deployments.
