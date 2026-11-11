<div align="center">

<img src="imag/originlens.jpeg" alt="OriginLens" width="520" />

### Understand where your content comes from.

A free, privacy-first web tool that checks images for AI labels and Content Credentials,
shows and removes hidden photo metadata, and analyses and rewrites text.
Image checks run in your browser — your images are never uploaded.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Hosting-000000?style=for-the-badge&logo=vercel&logoColor=white)

**[www.originlens.bond](https://www.originlens.bond)**

[Features](#-features) ·
[How it works](#-how-it-works) ·
[Quickstart](#-quickstart) ·
[Configuration](#-configuration) ·
[Deployment](#-deployment) ·
[Privacy](#-privacy-and-security)

</div>

---

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> About

OriginLens answers one question: **where did this content come from?**
Add an image or paste text, and OriginLens shows the evidence the content carries,
explains what that evidence does and doesn't prove, and lets you remove private
details before you share.

> [!IMPORTANT]
> No tool can prove with certainty whether an image or text was made by AI.
> OriginLens reports the evidence it finds, says plainly when there is none,
> labels its pixel check as experimental, and never shows an "AI score" for text.

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> Features

**Image Analyzer** — [`/analyzer`](https://www.originlens.bond/analyzer)

- **Content Credentials (C2PA)** read with the official C2PA SDK (WebAssembly), with signature check — including AI steps recorded in earlier layers of an image's history.
- **AI labels** in the file: C2PA / IPTC digital source type, generator names, Stable Diffusion and ComfyUI parameters.
- **Metadata viewer**: EXIF, XMP, IPTC, camera, software, dates and **GPS location**.
- **Privacy Clean**: removes EXIF, XMP, IPTC, Content Credentials and comments from JPEG, PNG and WEBP **without re-encoding** the picture.
- **Pixel check (experimental)**: the open [Community Forensics](https://huggingface.co/OwensLab/commfor-model-384) ViT-S/384 model, run on your device with ONNX Runtime Web.
- **Analyze an image URL**, fetched safely on the server (public addresses only).

**Text and Blog Intelligence** — [`/text`](https://www.originlens.bond/text)

- **Standard Scan**: sentence length variation, vocabulary diversity, stock phrases and repeated openers, with per-sentence flags. Runs in your browser.
- **Deep Scan**: an AI style review with observations and suggestions.
- **Rewrite Naturally**: five tones plus **Humanize**, a two-pass rewrite (after [lynote-ai/humanize-text](https://github.com/lynote-ai/humanize-text)) that checks against your original so the meaning can't drift.

**Accounts**

- Sign up with email + 6-digit code, Google or GitHub (Supabase Auth); welcome email via Resend.
- Free use: **1 image check and 1 text check per day without an account**; unlimited checks and 10 AI rewrites per day with a free account.

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> How it works

| Part | Runs in |
|---|---|
| Metadata, Content Credentials, AI labels, Privacy Clean, pixel check, Standard Scan | **The visitor's browser** — nothing uploaded |
| Rewrite, Humanize, Deep Scan (NVIDIA Nemotron) | `POST /api/text/rewrite`, `POST /api/text/deep-scan` |
| Fetch an image by URL (SSRF-safe: public IPs, ports 80/443, redirects re-checked) | `POST /api/images/analyze-url` |
| Free-use limits | `POST /api/usage/claim` → Supabase `consume_quota` |
| Accounts, profiles, welcome email, usage counters | Supabase (Auth, Postgres, Vault, `pg_net`) |

```
frontend/
  src/app/            pages (App Router) and server routes under src/app/api
  src/lib/            browser-side analysis: C2PA, metadata, Privacy Clean, pixel check, text signals
  src/lib/server/     server-only helpers: limits, NVIDIA client, prompts, safe URL fetch
  public/models/      pixel-check model (ONNX, 87 MB, downloaded on request)
supabase/migrations/  profiles, welcome email, usage limits
imag/                 logo and icon
```

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> Quickstart

Requirements: **Node 20+**.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Create `frontend/.env.local` first (see [Configuration](#-configuration)).

**Tests and checks**

```bash
cd frontend
node --test src/lib/*.test.mts src/lib/server/*.test.mts
npx tsc --noEmit && npm run lint && npm run build
```

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> Configuration

Set these in `frontend/.env.local` locally and as Vercel environment variables in production
(full list with notes in [`.env.example`](.env.example)). Never commit real values.

| Variable | Where it's used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (publishable key) | No |
| `SUPABASE_SECRET_KEY` | Server only — usage limits | **Yes** |
| `NVIDIA_API_KEY` | Server only — rewrite, Humanize, Deep Scan | **Yes** |
| `NVIDIA_MODEL` | Optional, defaults to `nvidia/nemotron-3-ultra-550b-a55b` | No |
| `NEXT_PUBLIC_SITE_URL` | Optional, defaults to `https://www.originlens.bond` | No |

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> Deployment

1. **Supabase**: apply [`supabase/migrations`](supabase/migrations) in order. Under *Auth → URL Configuration*,
   set the Site URL to your domain and add `https://<domain>/**` to Redirect URLs. Store the Resend key in
   Vault as `resend_api_key` for the welcome email.
2. **Vercel**: set the project's **Root Directory to `frontend`** and add the variables above.

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> Privacy and security

- Images are checked on the visitor's device and never leave it, except when they ask us to fetch one by URL.
- Text sent to Rewrite or Deep Scan goes to NVIDIA's API to produce the result and is not stored by us.
- Usage counters live in a Supabase schema the public API can't reach; only the server's secret key can update them.
- Strict Content Security Policy; the URL fetcher blocks private, loopback and link-local addresses.
- Removing metadata never changes where an image came from, and the site says so.

## <img src="imag/Originlens%20icon.png" width="24" alt="" /> Guides

- [How to check if an image is AI-generated](https://www.originlens.bond/blog/how-to-check-if-an-image-is-ai-generated)
- [What are Content Credentials (C2PA)?](https://www.originlens.bond/blog/what-are-content-credentials-c2pa)
- [Was it made by ChatGPT or Gemini? How to check an image](https://www.originlens.bond/blog/check-chatgpt-gemini-images)
- [How to remove metadata and GPS location from photos](https://www.originlens.bond/blog/remove-metadata-and-gps-from-photos)
- [AI text humanizer and writing analyzer: how it works](https://www.originlens.bond/blog/ai-text-humanizer-and-writing-analyzer)

<div align="center">
<br />
<img src="imag/Originlens%20icon.png" width="48" alt="OriginLens icon" />
<br />
<sub>OriginLens · signals are evidence, not verdicts.</sub>
</div>
