# Msg In A Bottle — Progress Log

Latest session: 2026-07-17 (previous: 2026-07-16)

## What this is

A minimalist, physics-based "message in a bottle" web app. Visitors type text into
a borderless input; it splits into individual letters that fall, collide, and
scatter under gravity on an HTML5 canvas (Matter.js). Each unique URL slug is its
own persistent "bottle." The core loop is **receive → read → reply → release**:
open a bottle, read the one note currently inside it, write a reply, and release
it — back to a specific person (private bottles) or into the public pool for a
stranger to find (public bottles).

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Matter.js** + Canvas 2D for the physics/rendering (no DOM nodes per letter)
- **Prisma 7** + **PostgreSQL** (Neon recommended) for persistence
- **Auth.js (next-auth v5, beta)**: Credentials provider (email/password, JWT
  sessions, `bcryptjs` hashing) **and** Google OAuth, added 2026-07-17 — no DB
  session adapter, both providers land on the same `User` table
- Plain CSS Modules (no Tailwind) — the whole UI surface is a canvas plus a
  handful of small floating controls

## What got built 2026-07-16 (foundations)

Project scaffold; the physics sandbox (`lib/physics/engine.ts`, `letters.ts`,
`render.ts`, `PhysicsCanvas.tsx`); rooms/bottles/messages
(`lib/rooms.ts`, `app/[slug]/page.tsx`, `app/api/`); accounts
(`lib/auth.ts`, `lib/auth.config.ts`, `proxy.ts`, Credentials-only at the time);
the decorative falling-bottles field on the sign-in page
(`components/BottlePhysics.tsx`, `lib/physics/bottleField.ts`). Full detail in
git history — this file now tracks the latest state rather than a per-day diff.

## What got built 2026-07-17

### 1. App icons
`app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` generated from the
`bottle3.png` illustration, rotated upright (cork at top).

### 2. The receive → read → reply → release loop
- `lib/rooms.ts#getOrCreateRoom` now fetches only the **latest** message
  (`take: 1, desc`) instead of full history — reading a bottle means reading the
  one note currently inside it; older messages stay archived but hidden.
- Bottles can be created **public** ("cast into the sea") or **private** ("just
  between us") — `Room.isPublic` is now a real choice threaded through
  `CreateBottleForm` → `POST /api/bottles` → `createOwnedRoom`.
- Sending a reply successfully seals the bottle: `components/BottleReleased.tsx`
  shows a confirmation — public bottles get a "find another bottle" link (reusing
  the random-bottle mechanic, extracted into `lib/randomBottle.ts` so it's not
  duplicated); private bottles just confirm delivery, no further link.
- Replies stay anonymous, matching the existing anonymous-drop-in model.

### 3. `/welcome` page
One shared interstitial (`app/welcome/page.tsx`, `components/WelcomePanel.tsx`)
for both "just signed in" and "just created a bottle": the latter shows the
bottle's shareable link with a copy-to-clipboard button and public/private-aware
copy. Gated by `proxy.ts` like `/dashboard`. DB-free previews at
`/preview/welcome` and `/preview/dashboard` mirror the existing `/preview`
pattern so these can be reviewed without a live database.

### 4. Message-sending UX
- The message you're reading is now static, centered serif text
  (`components/BottleMessage.tsx`) — not physics letters. Only *your own* typed
  reply still falls/scatters on the canvas.
- `components/MessageInput.tsx` has a "press enter to send" button plus a small
  bobbing `bottle.png` icon; on send, the icon drifts across the whole screen
  along a randomized path (CSS custom properties regenerated per send drive the
  keyframes) before fading out for good — it does not reappear.
- After a successful send, `RoomView` waits out the drift duration
  (`lib/driftTiming.ts`, one shared constant for both the CSS animation and the
  JS timer) then auto-navigates to `/dashboard`.
- Placeholder copy is context-aware: "Be the first to leave a note...", "Write
  your reply...", then plain "Type something..." after the first send attempt.
- Dead ends explored and fully reverted: an always-visible line-drawn bottle neck
  with a physics-driven cork bounce, and a canvas-physics bottle that dropped in
  and drifted away on its own. Both replaced by the button-icon approach above —
  no leftover code.

### 5. Corner UI cleanup
Dropped the editable `yoursite.com/[slug]` marker and the `[random]` link
entirely (`components/RoomSlugMarker.tsx`; deleted `components/RandomLink.tsx`
— its navigation logic lives on in `lib/randomBottle.ts`). Top-left is now just
the bobbing-bottle "back to dashboard" button, with the label centered directly
under the icon (not the whole row).

### 6. Sign-in page
- The decorative falling bottles (`components/BottlePhysics.tsx`) are now
  clickable — a movement-threshold check distinguishes a click from a drag, then
  `Matter.Query.point` hit-tests against bottle bodies. Clicking one navigates to
  `/preview`. (Every bottle currently routes to the same demo page since there's
  no live data yet to attach real per-bottle slugs to — worth upgrading once
  there's a real public-bottle list to fetch.)
- Added **Google OAuth** ("Sign in with Google") alongside the Credentials form.
- Added a small "Get in touch" contact link (`components/ContactInfo.tsx`,
  mailto — the address itself isn't printed as visible page text).
- Minor layout: form nudged down (`padding-top: 10vh` on the wrapper), tightened
  spacing around the "or" divider.

### 7. Google OAuth wiring
- `prisma/schema.prisma`: `User.passwordHash` is now nullable (Google-only
  accounts have none) — Prisma client regenerated; **no migration run yet**,
  still no live database.
- `lib/auth.ts`: added the `Google` provider (env-var convention `AUTH_GOOGLE_ID`
  / `AUTH_GOOGLE_SECRET`, both now set in `.env`). Extended the `jwt` callback so
  a Google sign-in upserts a matching row in our own `User` table by email —
  `session.user.id` stays a real DB id regardless of how someone signed in, so
  bottle ownership stays consistent. Credentials `authorize` now guards against a
  null `passwordHash` (a Google-only account can't be signed into via password).
- Verified via `curl` (replicating the CSRF handshake `next-auth/react`'s
  `signIn()` does automatically in a browser) that the OAuth redirect to
  `accounts.google.com` carries the correct `client_id` / `redirect_uri` /
  scopes — confirms the credentials in `.env` are wired correctly at the
  provider-config level, independent of the database being live.

## Verified

- `npx tsc --noEmit`, `npm run lint`, and `npm run build` are clean as of the
  last change today.
- No browser-automation tool is available in this environment (no
  `chromium-cli`, no Playwright installed) — verification was: build/typecheck/
  lint after every change, `curl` against the running dev server for routing
  and auth-redirect behavior, and opening pages in the user's real browser via
  `Start-Process` for visual review, with the user reporting back what they saw
  and iterating from there.

## Blocked / next steps

- **Still nothing has touched a real database.** `DATABASE_URL` in `.env` is
  still Prisma's placeholder. This blocks, end-to-end: Credentials sign-up/
  sign-in, Google sign-in completing (the `jwt` callback's `prisma.user.upsert`
  needs a DB), `/dashboard`, `/welcome`, and every real `/[slug]` room page
  (currently 500s on `ECONNREFUSED`).
- No migrations have ever been run (`prisma/migrations/` is empty) — the first
  migration needs to cover the schema as it now stands, including the
  `passwordHash` nullable change: `npx prisma migrate dev --name init`.
- Double-check the Google Cloud Console OAuth client has the exact authorized
  redirect URI registered: `http://localhost:3000/api/auth/callback/google`
  (plus the production equivalent once deployed).
- Next session, once a real Postgres connection is in place: sign in via both
  Credentials and Google; create a public bottle and a private bottle; confirm
  the private one never appears via `/api/rooms/random`; drop a reply
  anonymously from a second session on each; confirm the owner sees the reply as
  the new "latest" message on revisit; confirm the post-send auto-redirect to
  `/dashboard` actually fires (untestable in `/preview` since its send always
  fails without a DB).
- Consider upgrading the sign-in page's clickable bottles to route to real
  per-bottle slugs (fetched from the DB) instead of always landing on
  `/preview`, once there's real public-bottle data to draw from.
