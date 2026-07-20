# Tech Stack — Msg In A Bottle

## Frontend
- Next.js 16 (App Router, React Server Components, Turbopack)
- React 19
- TypeScript
- CSS Modules (no UI framework — hand-rolled component styling)
- Canvas-based physics animation using Matter.js (custom engine wrapper for falling-letter/bottle effects — `lib/physics/`)

## Backend
- Next.js Route Handlers (`app/api/**`) as the API layer
- NextAuth.js v5 (beta) — hybrid auth: Credentials (email/password, bcrypt-hashed) + Google OAuth
- JWT session strategy
- Custom middleware (`proxy.ts`) for route protection (`/dashboard`, `/admin`, `/diary`, `/welcome`)
- Custom in-memory rate limiting (fixed-window, per-IP) for abuse protection

## Database / ORM
- PostgreSQL
- Prisma ORM 7 (new `prisma-client` generator, generated client checked into `app/generated/prisma`)
- Schema: Users, Rooms (message "bottles"), Messages, DiaryEntry, Feedback (with status/category enums)

## Security
- Custom security headers (CSP frame-ancestors, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) via `next.config.ts`
- Password hashing with bcryptjs
- Capability-link design (unguessable room slugs via `nanoid`) rather than exposed sequential IDs

## Deployment / Infra
- Vercel (CI/CD on push to `main`)
- Environment-based config via `.env` / `dotenv`

## Feature Surface
- Ephemeral, link-based messaging ("bottles") with real-time physics-based visual delivery
- User accounts with dual auth (credentials + Google OAuth)
- Admin dashboard for operations/feedback triage (`OperationsDashboard`)
- Personal diary/journaling feature tied to user accounts
- Self-service account deletion / data wipe (GDPR-style "Wipe My Data")
- In-app feedback system with categorization (bug/love/incoming) and admin reply threading

## Suggested Resume Bullet
> Built and deployed a full-stack Next.js 16 / React 19 app with PostgreSQL + Prisma, featuring custom Matter.js physics-based UI, dual-provider auth (NextAuth v5, credentials + OAuth), rate-limited APIs, and an admin ops dashboard — deployed on Vercel.
