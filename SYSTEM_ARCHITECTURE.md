# System Architecture — SM Travels International

## Overview

Single-tenant travel ERP + public marketing website for SM Travels International (Hajj/Umrah/visa/tickets/tours).

```
Browser (SPA)
    │  HTTPS (Cloudflare)
    ▼
nginx (origin)
    ├─ /           → frontend/dist (Vite React SPA)
    ├─ /assets/*   → long-cache immutable
    └─ /api/*      → 127.0.0.1:4030 (Express)
                        │
                        ├─ Prisma → PostgreSQL
                        ├─ uploads volume (auth download only)
                        ├─ SMTP (Gmail)
                        ├─ Google Vision (OCR)
                        ├─ Google Gemini (AI)
                        └─ Notification worker (in-process, 15s)
```

## Frontend

- **Stack:** React + Vite + TanStack Query + React Router + i18n (Bangla default)
- **Zones:** Public site, `/erp/*` staff app, portals (`/portal`, `/agent`, …)
- **Auth:** Access token in memory; refresh cookie `httpOnly` path `/api/auth`
- **Code split:** ERP modules + portals + Auth/Booking/Packages/Blog lazy-loaded

## Backend

- **Stack:** Express + TypeScript + Prisma + Zod contracts
- **AuthZ:** JWT + DB status check; RBAC `Role` / `Permission` / `UserRoleLink`; branch scope
- **Errors:** `{ error, message?, details?, requestId }`
- **Rate limits:** global + login/OTP/public intake/AI/refresh/upload
- **Uploads:** multer tmp → magic-byte check → `UPLOAD_DIR/YYYY/MM/uuid.ext`

## Data

- PostgreSQL with Prisma schema (customers, bookings, finance, CMS, outbound notifications, …)
- PII fields encrypted at rest via application KEK

## Integrations (feature-flagged)

| Integration | Flag / env | Failure mode |
|-------------|------------|--------------|
| Email | SMTP configured | Queue fails honestly / retries |
| SMS | BULKSMSBD_* | Cancelled / log-only |
| WhatsApp | WASENDER_* | Cancelled / log-only |
| Vision | GOOGLE_APPLICATION_CREDENTIALS | OCR endpoints 503/error |
| Gemini | GEMINI_API_KEY | AI 502/503 if quota |

## Deployment topology

- API never public; nginx reverse-proxy only
- systemd hardening: `ProtectSystem=strict`, `NoNewPrivileges`, scoped `ReadWritePaths`
