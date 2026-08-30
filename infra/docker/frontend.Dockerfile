# ─────────────────────────────────────────────────────────────────────────
# OriginLens — Frontend (Angular) Dockerfile
# Multi-stage: build with Node, serve with nginx.
# Skeleton for Phase 1. Real implementation lands in Phase 2.
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps separately for cache
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./
RUN npm ci || npm install

# Build
COPY apps/frontend/ ./
RUN npm run build -- --configuration=production

# ── Runtime stage ───────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Replace default config with ours
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist/originlens-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
