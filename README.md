# OriginLens

**Understand where your content comes from.** Privacy-first image metadata inspection, C2PA provenance
verification, lossless metadata removal, and explainable text intelligence.

| Part | Stack | Deploys to |
|---|---|---|
| `frontend/` | Next.js 16 (App Router) + Tailwind v4 + Supabase JS | Vercel |
| `backend/` | FastAPI, SQLAlchemy 2 + Alembic, Pillow, c2pa-python, ExifTool, Redis | Docker (Render / Fly / Railway) |
| Database / Auth | Supabase Postgres + Supabase Auth | Supabase |

## What works, and what is intentionally not faked

| Feature | Status |
|---|---|
| Upload (drag-drop, browse, paste), signature + size + decompression-bomb validation | ✅ |
| Metadata: EXIF (IFD0/Exif/GPS), XMP, IPTC, PNG text, comments, ICC, color, optional ExifTool deep read | ✅ |
| C2PA verification (`c2pa-python` Reader, as in the referenced article) | ✅ (not yet tested against a real signed sample) |
| Privacy Clean: lossless removal of GPS / EXIF / XMP / IPTC / C2PA / comments for JPEG, PNG, WEBP | ✅ pixels verified byte-identical in tests |
| Image URL analysis with SSRF protection (DNS pinning, private-IP block, redirect re-check, ports 80/443) | ✅ |
| AI image signals | ✅ evidence only. **No probability score**: no validated detector is integrated |
| Text analysis (Standard Scan): local stylometric signals, sentence-level flags | ✅ descriptive only, **no AI score** |
| Deep Scan + Rewrite Naturally via OpenRouter → Groq fallback (timeouts, retries, circuit breaker, usage tracking) | ✅ needs API keys |
| Supabase Auth (signup/login/logout; refresh rotation handled by Supabase) | ✅ needs a Supabase project |
| Quotas per plan (anonymous / free / pro), Redis rate limiting, enforced server-side | ✅ |
| Pricing Free $0 / Pro $6 with USD/INR (live rate, configurable fallback) | ✅ display only |
| Pro checkout / payments | ❌ not built: no payment provider chosen. Set `subscriptions.plan='pro'` manually |
| Background jobs (Celery) | ❌ not needed yet: all work is synchronous and bounded |
| GIF Privacy Clean, SVG | GIF is analyze-only; SVG is rejected for safety |

## Local development

Requirements: Python 3.10+, [uv](https://docs.astral.sh/uv/), Node 20+, and either Docker or a local Redis + Postgres.

```bash
cp .env.example .env
```

Full stack in Docker (Postgres, Redis, API on :8000, web on :3000):

```bash
docker compose up --build
```

Or run the pieces yourself:

```bash
cd backend && uv sync && uv run alembic upgrade head && uv run uvicorn app.main:app --reload
```

```bash
cd frontend && npm install && npm run dev
```

The frontend reads `frontend/.env.local` (see `frontend/.env.example`).

## Tests and checks

```bash
cd backend && uv run pytest && uv run ruff check app tests
```

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

## Deployment

1. **Supabase**: create a project. Copy the Postgres connection string into `DATABASE_URL`
   (use `postgresql+psycopg://…`). Copy the project URL into `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`, and the anon key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Under Auth → URL configuration, add your Vercel domain.
2. **API** (`backend/Dockerfile`) on Render / Fly / Railway, with a managed Redis. Set `ENV=production`,
   `CORS_ORIGINS=["https://your-app.vercel.app"]` and `TRUSTED_PROXY_COUNT=1` if behind one proxy.
   Add the LLM keys and Redis URL. Migrations run on container start.
3. **Frontend** on Vercel: root directory `frontend`; set the three `NEXT_PUBLIC_*` variables.

The API is not on Vercel because it needs ExifTool, persistent Redis connections, and uploads larger than
Vercel's ~4.5 MB function body limit.

## API

Interactive docs are at `/docs` when `ENV` is not `production`. All routes are prefixed with `/api` and rate limited per IP.
Errors use one shape: `{"error": {"code", "message", "details", "request_id"}}`.

| Method | Path | Quota | Body |
|---|---|---|---|
| POST | `/images/analyze` | image | multipart `file` |
| POST | `/images/analyze-url` | image | `{"url"}` |
| POST | `/images/ai-signals` | image | multipart `file` |
| POST | `/images/clean` | image | multipart `file`, `categories` = comma list of `gps,exif,xmp,iptc,c2pa,comments` |
| POST | `/text/analyze` | text (+llm for deep) | `{"text", "mode": "standard"\|"deep"}` |
| POST | `/text/rewrite` | llm | `{"text", "tone"}` |
| GET | `/pricing`, `/usage`, `/health` | — | |
| GET | `/me` | — | requires `Authorization: Bearer <supabase access token>` |

## Privacy and security notes

- Uploaded images and text are processed in memory and never written to disk or the database.
  ExifTool reads from stdin. The DB stores only job kind, status, duration and provider token counts.
- Logs are JSON with request IDs. They contain paths and status codes only: no bodies, query strings or tokens.
- The API uses bearer tokens, not cookies, so CSRF does not apply. The Supabase session lives in browser storage.
- Removing metadata never changes an image's true origin, and the UI says so.
