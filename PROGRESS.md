# Msg In A Bottle — Progress Log

Session date: 2026-07-16

## What this is

A minimalist, physics-based "message in a bottle" web app. Visitors type text into
a borderless input; it splits into individual letters that fall, collide, and
scatter under gravity on an HTML5 canvas (Matter.js). Each unique URL slug is its
own persistent "bottle" — signed-in users create bottles and collect the messages
left in them; anyone can visit a bottle's link and drop a message in without
signing in.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Matter.js** + Canvas 2D for the physics/rendering (no DOM nodes per letter)
- **Prisma 7** + **PostgreSQL** (Neon recommended) for persistence
- **Auth.js (next-auth v5, beta)** with a Credentials provider (email/password),
  JWT sessions, `bcryptjs` for password hashing — no OAuth, no DB session adapter
- Plain CSS Modules (no Tailwind) — the whole UI surface is a canvas plus a
  handful of small floating controls

## What got built today

### 1. Project scaffold
Replaced the empty placeholder repo with a proper Next.js App Router project.
Installed `matter-js`, `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`,
`nanoid`.

### 2. Physics sandbox (`lib/physics/`, `components/PhysicsCanvas.tsx`)
- `engine.ts` — creates/resizes/tears down a Matter world with floor + walls,
  fully decoupled from React state (lives in refs, driven by a manual
  `requestAnimationFrame` loop so physics-step and draw-step stay locked
  together).
- `letters.ts` — kerning-aware layout: walks a string with `ctx.measureText`
  per character to get real widths/spacing before creating one Matter body per
  non-space character (spaces just advance the layout cursor).
- `render.ts` — draws each letter body's glyph at its live position/rotation
  each frame.
- `PhysicsCanvas.tsx` — owns the canvas, DPR scaling, resize handling, mouse
  drag/throw (`Matter.MouseConstraint`), and exposes an imperative `spawnText()`
  handle so React never re-renders on physics ticks.
- Font: Cormorant Garamond (elegant serif, loaded via Google Fonts), currently
  36px/normal weight, matched between the typed input and the falling letters.

### 3. Rooms / bottles (`lib/rooms.ts`, `app/[slug]/page.tsx`, `app/api/`)
- `Room` = a bottle (unique slug, optional owner, optional `name` used as a
  "kind words" prompt), `Message` = a dropped-in message (text only — no
  position is persisted, so a room replays its message history as a fresh,
  staggered physics drop every time it's loaded).
- Visiting any `/[slug]` upserts the room (public, unowned) so anyone can drop a
  message without an account — this is the "stranger finds a bottle" path.
- API routes: `GET /api/rooms/[slug]` (fetch-or-create), `GET /api/rooms/random`
  (random public room, 404 if none), `POST /api/messages` (append a message).
- New text appears instantly client-side (optimistic); the POST to persist it
  fires in parallel and only logs a warning on failure.

### 4. Corner UI
- Top-left: bottle icon (bobbing/rocking float animation) + arrow back to
  `/dashboard`, plus an editable `yoursite.com/[slug]` marker for jumping to a
  custom room. Under it: the owning user's name and the bottle's "kind words"
  prompt, when the room has an owner.
- Top-right: `[random]` link to a random public bottle, with a client-side
  fallback (generates a fresh slug) if none exist yet.
- Bottom-center: the borderless "Type something..." input.

### 5. Accounts (`lib/auth.ts`, `lib/auth.config.ts`, `proxy.ts`)
- Added a `User` model (email, name, password hash) and an optional
  `Room.ownerId`.
- Sign-up collects name/email/password; sign-in is email/password via Auth.js
  Credentials + JWT sessions (no DB-backed sessions needed).
- Split the Auth.js config in two: `auth.config.ts` (edge-safe, no Prisma) used
  by `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) to gate
  `/dashboard/**`, and `auth.ts` (full config with the Prisma-backed Credentials
  provider) used everywhere else — avoids bundling the Postgres driver into the
  Edge runtime.
- `/` is now the sign-in/sign-up hero page (previously it auto-loaded an
  anonymous "lobby" room — that's still reachable directly at `/lobby`).
- `/dashboard` (protected): create a bottle (slug + optional prompt) and read
  the text of every message collected in each bottle you own.
- `/preview`: a DB-free route that renders the physics sandbox directly, used
  for testing without needing the database wired up.

### 6. Sign-in page decoration
- `components/BottlePhysics.tsx` + `lib/physics/bottleField.ts`: a second,
  independent Matter.js field (reusing the same generic `engine.ts`) that drops
  7 bottle illustrations from above with staggered timing, lets them collide
  and settle at the bottom, and are draggable. Hovering a bottle applies a
  small oscillating force so it wobbles in place (canvas-drawn, so this is done
  via per-frame hit-testing with `Matter.Query.point`, not CSS `:hover`).

## Verified

- `npx tsc --noEmit` and `npm run build` are clean as of the last change.
- `/`, `/preview`, and the `/dashboard` auth-redirect were smoke-tested via
  `curl` against the local dev server.
- Manual in-browser testing (typing, dragging, resizing, hover) was done by the
  user throughout the session — not automated, since no browser/screenshot tool
  is available in this environment.

## Blocked / next steps

- **Nothing has touched a real database yet.** `DATABASE_URL` in `.env` is
  still the placeholder Prisma generated. Sign-up, sign-in, `/dashboard`, and
  message persistence on real `/[slug]` rooms all need a live Postgres
  connection before they can be exercised end-to-end.
- Next session: get a Neon connection string into `.env`, run
  `npx prisma migrate dev --name init`, then do a full pass — sign up, create a
  bottle, drop a message anonymously from another "visitor", sign back in and
  confirm it shows up as collected.
- Open design assumption to double-check: anyone can drop a message into any
  bottle without signing in; only creating a bottle and reading its collected
  messages requires an account. Flag it if that's not the intended model.
