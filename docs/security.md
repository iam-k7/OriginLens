# OriginLens — Security

This document captures OriginLens' security model. The threat model is
centered on a public SaaS that handles untrusted uploads and calls external
LLM providers, while honoring a strict privacy promise: **no permanent
storage of user images or text**.

## 1. Trust boundaries

```
                ┌──────────────┐
   Untrusted ──▶│   Browser    │ (Angular SPA)
                └──────┬───────┘
                       │ HTTPS + JWT
                       ▼
                ┌──────────────┐
                │   FastAPI    │ ◀── trusted boundary
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Postgres        Redis        LLM Providers
                                     (OpenRouter, Groq)
```

The browser is untrusted. Everything inside the backend is trusted, but every
input that crosses the boundary is validated and rate-limited.

## 2. Secrets

- **All secrets come from environment variables.** No secret is ever hard-coded.
- `.env` is gitignored. `.env.example` is committed with placeholders only.
- Local Claude settings containing tokens (`.claude/settings.local.json`) are
  in `.gitignore`.
- JWT secret is rotated by redeploy; rotation invalidates all sessions.
- LLM provider keys are server-side only; the frontend never sees them.

If a secret is ever committed by accident, treat it as compromised:
1. Revoke / rotate the credential at the issuer.
2. Purge from git history (`git filter-repo`).
3. Add the file pattern to the secrets pre-commit hook (gitleaks) so the
   mistake cannot recur.

## 3. Authentication

- Passwords hashed with bcrypt (cost factor ≥ 12).
- Access tokens: HS256 JWT, short TTL (15 min default).
- Refresh tokens: opaque, hashed at rest, rotated on every use, revocable.
- Logout revokes the current refresh token.
- Future: Google / GitHub OAuth. Architecture prepared, not implemented in v1.

### Token storage on the client

- Access token in memory (Angular service). Never in `localStorage`.
- Refresh token delivered via `HttpOnly; Secure; SameSite=Strict` cookie when
  the frontend is served from the same origin as the backend; passed in the
  body otherwise.

## 4. Authorization

- All expensive endpoints require an authenticated user.
- Free-tier limits are checked before the work; Pro-tier is a higher cap.
- Admin endpoints (`/admin/*`, future) are guarded by `role == "admin"`.
- Provider / system endpoints are not exposed to the public network.

## 5. Input validation

Every request body, query parameter, header, and uploaded file is validated
*before* any business logic runs.

### 5.1 Uploads

- **MIME from Content-Type** is *only a hint*; we validate the **magic bytes**
  of the file. The file's claimed type must match its bytes.
- Maximum upload size: `MAX_UPLOAD_BYTES` (default 20 MiB).
- Maximum decoded pixels: `MAX_IMAGE_PIXELS` (default 200 MP) to defeat
  decompression bombs. Pillow's `DecompressionBombWarning` is treated as a
  hard failure.
- Filenames are stripped of path components (`secure_filename`); the on-disk
  name is a UUID, not the user's filename.
- `ALLOW_SVG=false` by default. If enabled, SVGs are sanitized with
  `defusedxml` and stripped of `<script>`, event handlers, and external
  references.

### 5.2 URL analysis (SSRF)

The URL analyzer fetches remote images. SSRF is the dominant risk.

Rules:

- Allowed schemes: `http`, `https` only.
- Reject literal hostnames: `localhost`, `*.local`, `metadata.google.internal`,
  `metadata`, etc.
- Resolve the hostname; reject if it resolves to any of:
  - `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`,
    `169.254.0.0/16` (incl. cloud metadata), `0.0.0.0/8`, `100.64.0.0/10`
  - IPv6: `::1`, `fc00::/7`, `fe80::/10`, `::ffff:` mapped IPv4 of the above
- Max 3 redirects, with the same rules re-applied at every hop.
- Max response size: `MAX_URL_FETCH_BYTES` (e.g. 25 MiB) — disconnect after
  the cap.
- Timeout: `OPENROUTER_TIMEOUT_SECONDS`-style value applied to the fetcher.
- Re-validate after redirects; do not trust the originally-validated host.
- Reject any response whose `Content-Type` is not a supported image type.
- Reject any image whose decoded pixel count exceeds `MAX_IMAGE_PIXELS`.

### 5.3 Text input

- Length-capped per endpoint.
- Strip control characters before logging.
- PII minimization: when calling an LLM, send only the minimum content
  necessary; never echo back the full text in error messages.

## 6. LLM output handling

- All LLM responses are parsed with Pydantic into a fixed schema.
- Unknown fields are dropped, not trusted.
- Numeric scores are clamped to `[0, 1]`.
- Free-text fields (`explanation`, `limitations`) are rendered safely in the
  Angular template; never as raw HTML.

## 7. Quotas & rate limiting

- **Quotas** are stored in Postgres and incremented atomically per request.
- **Rate limits** are sliding-window counters in Redis.
- Both are enforced **server-side**; the Angular client cannot bypass them.
- Quota / rate-limit violations return `429` with a normalized envelope:
  `{ code, message, retry_after }`.

## 8. Headers

Backend (`app/main.py` middleware) and nginx both set:

| Header                       | Value                                          |
|------------------------------|------------------------------------------------|
| `Content-Security-Policy`    | `default-src 'self'; img-src 'self' data:; connect-src 'self' <BACKEND_URL>; …` |
| `X-Content-Type-Options`     | `nosniff`                                      |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`               |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=()`      |
| `X-Frame-Options`            | `DENY`                                         |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains` (prod)   |
| `Cross-Origin-Opener-Policy` | `same-origin`                                  |

CORS is allowlisted to `CORS_ALLOWED_ORIGINS` (typically only the frontend
URL). No wildcard.

## 9. CORS / CSRF

- CORS is allowlist-only, with credentials off by default.
- Because we use `Authorization: Bearer …` headers (not cookies), classic
  CSRF does not apply. If we later add cookie-based sessions, we add
  `SameSite=Strict` and a CSRF token strategy.

## 10. Error handling

- Production responses never include stack traces, raw exception messages,
  or internal paths.
- The global error handler returns:
  ```json
  { "code": "RATE_LIMITED", "message": "You have reached your current usage limit.", "retry_after": 120 }
  ```
- Internal details go to the structured log only.

## 11. Logging

Allowed:

- Request ID, user ID (if authed), endpoint, status, latency.
- Provider name, model, latency, token counts, cost.
- Quota counter deltas.
- Validation failures (codes, not bodies).

Disallowed:

- API keys, JWT secrets, bcrypt hashes.
- File bytes, base64 of files, image dimensions for bomb-suspect payloads.
- Full uploaded text, full rewrite output.
- Passwords, password reset tokens, refresh tokens.

`structlog` is configured with an explicit allowlist of keys.

## 12. Dependency hygiene

- Backend deps pinned in `apps/backend/pyproject.toml`.
- Frontend deps pinned in `apps/frontend/package.json`.
- `pip-audit` and `npm audit` are run in CI.
- A secrets pre-commit hook (gitleaks) blocks obvious secret patterns.

## 13. Threat model summary

| Threat                                  | Mitigation                                  |
|-----------------------------------------|---------------------------------------------|
| Compromised provider key                | Server-side only, scoped per provider       |
| SSRF via image URL                      | Resolve + block private/loopback ranges     |
| Decompression bomb                      | `MAX_IMAGE_PIXELS` cap + Pillow guard       |
| Polyglot / type-confusion upload        | Magic-byte validation                       |
| SVG XSS                                 | `ALLOW_SVG=false` default; sanitize if on   |
| Path traversal in filename              | `secure_filename`, UUID temp paths          |
| Quota / rate-limit bypass               | Server-side enforcement                     |
| JWT forgery                             | HS256 with rotated secret, short TTL        |
| LLM JSON injection                      | Pydantic validation, no eval, length cap    |
| Stack-trace leak                        | Global error handler, env-aware response    |
| Clickjacking                            | `X-Frame-Options: DENY` + CSP `frame-ancestors` |
| Open redirect                           | Backend never redirects; only client route  |
| Session hijacking                       | Short access TTL + refresh rotation         |
| Brute-force login                       | Redis rate limit on auth endpoints          |

## 14. Reporting

Security issues should be reported privately. A `SECURITY.md` with contact
details is added in a later phase.
