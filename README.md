# OriginLens

**Understand where your content comes from.** Privacy-first image metadata inspection, Content Credentials
(C2PA) verification, lossless metadata removal, an experimental AI-image pixel check, and explainable
text intelligence with AI rewriting.

| Part | Stack | Runs on |
|---|---|---|
| `frontend/` | Next.js 16 (App Router) + Tailwind v4 + Supabase JS, with server routes under `src/app/api` | Vercel |
| `supabase/` | Postgres migrations: profiles, welcome email (Resend via `pg_net`), usage limits | Supabase |

There is no separate API server. Image checks run in the visitor's browser; the few things that need a
server (AI writing, fetching an image by URL, usage limits) are Next.js route handlers on Vercel.

## Where each feature runs

| Feature | Runs in |
|---|---|
| Metadata (EXIF / XMP / IPTC / GPS), Content Credentials (official C2PA SDK in WebAssembly) | Browser |
| Privacy Clean (lossless removal of EXIF / XMP / IPTC / C2PA / comments for JPEG, PNG, WEBP) | Browser |
| AI labels in the file (C2PA source type, generator fields, diffusion parameters) | Browser |
| Pixel check (Community Forensics ViT-S/384, ONNX, 87 MB, downloaded on request) | Browser |
| Text Standard Scan (stylistic signals, no AI score) | Browser |
| Rewrite (5 tones + Humanize) and Deep Scan, via NVIDIA (Nemotron 3 Ultra) | `/api/text/rewrite`, `/api/text/deep-scan` |
| Analyze an image URL (SSRF-safe: public addresses only, ports 80/443, redirects re-checked) | `/api/images/analyze-url` |
| Free-use limits (logged out: 1 image + 1 text check per day; logged in: 10 AI calls per day) | `/api/usage/claim` + Supabase `consume_quota` |
| Sign-up (email code, Google, GitHub), profiles, welcome email | Supabase |

## Local development

Requirements: Node 20+.

```bash
cd frontend && npm install && npm run dev
```

The site reads `frontend/.env.local` (see `frontend/.env.example` and the root `.env.example`).

## Tests and checks

```bash
cd frontend && node --test src/lib/*.test.mts src/lib/server/*.test.mts && npx tsc --noEmit && npm run lint && npm run build
```

## Deployment

1. **Supabase**: apply `supabase/migrations` in order. Under Auth → URL configuration set the Site URL to
   your domain and add `https://<domain>/**` to Redirect URLs. Store the Resend key in Vault as
   `resend_api_key` (see `20261022181209_welcome_email.sql`).
2. **Vercel**: root directory `frontend`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SECRET_KEY` (server only) and `NVIDIA_API_KEY` (server only).

## Privacy and security notes

- Images never leave the visitor's device, except when they ask us to fetch one by URL.
- Text sent to Rewrite or Deep Scan goes to NVIDIA's API to produce the result and is not stored by us.
- Usage limits are counted in a schema the public Supabase API does not expose; only the server's secret key can update them.
- Removing metadata never changes an image's true origin, and the UI says so.
