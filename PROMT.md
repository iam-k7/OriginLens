# Build OriginLens — Production-Ready AI SaaS

Act as a senior full-stack developer, AI engineer, security engineer, and UI/UX designer. Build **OriginLens**, a privacy-first SaaS platform for image analysis, AI-generation signals, metadata inspection and removal, image provenance, and text analysis.

**Tagline:** Understand where your content comes from.

## 1. Reference Websites

Study these websites for UI/UX inspiration and feature workflows:

- Image analyzer: https://media.sens.center/
- AI text detector: https://www.zerogpt.com/
- Text rewriting: https://stealthwriter.ai/
- Metadata/privacy reference: https://dataengineeringtamil.substack.com/p/how-does-linkedin-know-your-image

Use these references to understand layouts, workflows, and interactions. Create original branding, components, copy, and code. Do not copy their proprietary assets or source code.

## 2. Technology Stack

- Frontend: Node.js + Tailywid or releted tech stack
- Backend: Python + FastAPI
- Database: PostgreSQL
- Cache and rate limiting: Redis
- Image processing: Pillow, ExifTool where appropriate, and open-source metadata libraries
- Provenance: C2PA-compatible tools where supported
- AI providers: OpenRouter and Groq
- Background jobs: Celery or an appropriate lightweight alternative
- Deployment: vercel
- Database: Supabase + Authetication for login

Use stable, compatible dependencies. Keep API keys and secrets in environment variables. Create `.env.example` and never commit `.env`.

## 3. Design and UI

Create a premium, modern, trustworthy SaaS interface.

- White background with orange accents.
- Subtle line textures, clean typography, spacious layouts, and restrained shadows.
- Responsive design for mobile, tablet, and desktop.
- Accessible forms, buttons, keyboard navigation, and clear loading/error states.
- Avoid excessive gradients, glowing effects, and generic futuristic AI designs.

Create a polished landing page, navigation bar, footer, analyzer workspace, text tools, pricing page, and authentication screens.

Navigation:
- Home
- Image Analyzer
- Text and Blog Intelligence
- Pricing
- Login / Sign Up

## 4. Image Analyzer

Route: `/analyzer`

Implement:
- Drag-and-drop image upload.
- Browse files, paste images where supported, preview, clear, and remove.
- JPG, JPEG, PNG, and WEBP support; support GIF and SVG only where safe and technically appropriate.
- File size and actual file-signature validation.
- Image dimensions, format, file size, color information, and supported technical properties.
- EXIF and other available metadata inspection.
- GPS, camera, software, author, and timestamp metadata where present.
- C2PA provenance verification when supported.
- AI-generation signal analysis with evidence, confidence, limitations, and explanations.
- Image URL analysis with strict SSRF protection.
- Metadata comparison before and after sanitization.

Use this exact code to find metadata - https://dataengineeringtamil.substack.com/p/how-does-linkedin-know-your-image

Never fabricate metadata, provenance, reverse-search matches, or AI scores.

## 5. Real Metadata Removal

Implement a working **Privacy Clean** feature.

Workflow:
1. Upload and validate an image.
2. Inspect and display its available metadata.
3. Let the user select supported metadata fields or remove all supported removable metadata.
4. Generate a cleaned downloadable image.
5. Show before/after metadata comparisons.
6. Display original and cleaned file sizes and dimensions.
7. Preserve image quality, dimensions, color profiles, and transparency wherever technically possible.

Use appropriate libraries and format-specific processing. Avoid unnecessary recompression. Explain any limitations or metadata that cannot safely be removed.

Do not overwrite the original file. Do not permanently store uploaded images. Use temporary in-memory processing when practical and reliably delete temporary files after processing.

Removing metadata must never be described as changing an image's true origin or making AI-generated content human-created.

## 6. AI Image Signals

Provide a clear action called **Analyze AI Signals**.

Results should include:
- Signal score, only when supported by an implemented and validated method.
- Confidence level.
- Available metadata and provenance evidence.
- Technical signals.
- Explanation and limitations.

Do not invent scores or claim that AI detection is 100% accurate. If no real detector is integrated, clearly show that the capability is unavailable rather than generating a fake result.

## 7. Text Intelligence

Route: `/text`

Implement:
- Text editor with paste, clear, and TXT upload.
- Text analysis with explainable stylistic signals.
- Sentence-level analysis when supported.
- Rewrite Naturally feature for clarity, readability, flow, and tone.
- Standard Scan and optional Deep Scan.
- Structured results with confidence and limitations.

Use OpenRouter as the primary LLM provider and Groq as a configurable fallback.

Create a backend provider interface with timeout handling, bounded retries, circuit breaking, model configuration, normalized errors, and usage tracking.

Never guarantee detector bypasses or a 100% human score. If AI detection is not backed by a validated detector, do not present LLM guesses as reliable detection results.

## 8. Backend and Database

Use modular FastAPI architecture with:
- API routes
- Pydantic schemas
- SQLAlchemy models and repositories
- Service layer
- Provider interfaces
- Configuration and security modules
- Database migrations
- Structured logging
- Automated tests

Create database entities where needed for users, subscriptions, usage, analysis jobs, refresh tokens, provider usage, and audit events.

Store account and usage information only as needed. Do not persist uploaded images or full private text by default.

## 9. Authentication and Pricing

Implement secure registration, login, logout, access tokens, and refresh-token rotation. Use strong password hashing and secure cookie handling where appropriate.

Create Free and Pro pricing plans:
- Free: $0/month.
- Pro: $6/month.

Support USD and INR display through a currency service with a configurable fallback rate.

Enforce subscription quotas and usage limits on the backend, never only in Angular. Make limits configurable. Do not advertise unlimited usage without appropriate abuse and cost controls.

## 10. Security and Privacy

Implement:
- Strict CORS configuration.
- Request validation and normalized errors.
- Redis-backed rate limiting.
- Secure HTTP headers.
- File size limits and safe image decoding.
- SVG sanitization or rejection where necessary.
- SSRF protection for URL analysis, including DNS rebinding and redirect checks.
- Private and reserved IP blocking.
- Timeouts and resource limits.
- CSRF protection where applicable.
- Secret management and dependency security checks.
- Request IDs and privacy-safe logs.

Never expose provider API keys, passwords, tokens, or uploaded content in logs.

## 11. Project Setup

Create a maintainable directory structure separating Angular features, FastAPI routes, services, providers, schemas, models, prompts, and tests.

Provide:
- `docker-compose.yml`
- Backend and frontend Dockerfiles
- `.env.example`
- `.gitignore`
- Database migrations
- README with setup and deployment instructions
- API documentation
- Unit and integration tests

## 12. Development Rules

First inspect the existing repository, its files, dependencies, and current implementation. Do not overwrite working functionality unnecessarily.

Then work incrementally:
1. Repository assessment and architecture.
2. Frontend shell and design system.
3. Image upload and analysis.
4. Metadata inspection.
5. Real metadata sanitization and download.
6. Text analysis and rewriting.
7. LLM provider abstraction.
8. Authentication and database.
9. Quotas, rate limiting, and pricing.
10. Security hardening, tests, and Docker deployment.

After each phase, run the relevant tests, check TypeScript compilation, lint/type-check the Python backend, verify routes, and review security implications.

Fix errors before moving to the next phase. Clearly report what works, what is mocked, what remains incomplete, and any external API keys required.

**Start now:** Inspect the repository and produce a concise implementation plan. If the repository is empty, establish the initial architecture and proceed phase by phase. Do not replace existing code blindly or claim untested functionality is production-ready.