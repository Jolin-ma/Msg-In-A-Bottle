# Msg In A Bottle — Progress Log

Latest session: 2026-07-18 (previous: 2026-07-17e, 2026-07-17d, 2026-07-17c, 2026-07-17b, 2026-07-17, 2026-07-16)

## What this is

A minimalist, physics-based "message in a bottle" web app. Visitors type text into
a borderless input; it splits into individual letters that fall, collide, and
scatter under gravity on an HTML5 canvas (Matter.js). Each unique URL slug is its
own persistent "bottle." The core loop is **receive → read → reply → release**:
open a bottle, read the one note currently inside it, write a reply, and release
it — back to a specific person (private bottles) or into the public pool for a
stranger to find (public bottles). A bottle can also be flagged as a **diary**
at creation — same physics/visuals, but entries just accumulate with no
seal-and-release step, for writing to yourself instead of someone else.

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

## What got built 2026-07-17b (real database)

- `DATABASE_URL` in `.env` now points at a live Neon Postgres project (pooled
  connection string, `sslmode=require&channel_binding=require`). `.env` is
  gitignored, confirmed via `git check-ignore`.
- Ran the first migration: `npx prisma migrate dev --name init` →
  `prisma/migrations/20260717143950_init/`. Schema (including the nullable
  `passwordHash`) is now live in Neon.
- `npx tsc --noEmit`, `npm run lint` (0 errors, the one pre-existing
  `no-page-custom-font` warning in `app/layout.tsx` is unrelated), and the dev
  server all clean/healthy against the real DB.
- End-to-end verification via `curl` against the running dev server, using a
  disposable `test-verify@example.com` account (registered, exercised, then
  deleted afterward — DB is back to empty of test data):
  - `POST /api/auth/register` → 201, row lands in `User`.
  - Credentials sign-in via the CSRF handshake (`/api/auth/csrf` →
    `/api/auth/callback/credentials`) → real session with a DB-backed
    `user.id`.
  - Created one public and one private bottle via `POST /api/bottles`.
  - `GET /api/rooms/random` called 5x: only ever returned the public slug —
    private bottle confirmed never leaking through the random-bottle endpoint.
  - Dropped an anonymous reply into each bottle via `POST /api/messages`, then
    `GET /api/rooms/[slug]` confirmed the owner sees that reply as the new
    (only) latest message — matches the `take: 1, desc` "one note currently in
    the bottle" model.
  - `/welcome` gating: 200 when authed, 307 redirect when not.
  - Cleanup done via `npx prisma db execute` (raw SQL) rather than the Prisma
    JS client directly — the generated client at `app/generated/prisma` is
    TypeScript-only (no compiled `.js`), so it can't be `node`-required
    ad hoc; either run through the app itself or use `prisma db execute` /
    `tsx` for one-off scripts against it going forward.
- **Not yet verified in-session** (needs a real browser, not curl): Google
  OAuth completing end-to-end now that the `jwt` callback's
  `prisma.user.upsert` has a live DB to write to; the physics rendering itself;
  the post-send auto-redirect to `/dashboard` firing at the right time. Dev
  server was left running on `http://localhost:3000` and opened in the
  system browser for manual visual review.

## What got built 2026-07-17c (dashboard, letter persistence, sharing controls, deploy prep)

Google sign-in was confirmed working in the user's real browser this session
(the item the 2026-07-17b log left unverified). Everything below was verified
against the live Neon DB via `curl` for data/API correctness, with disposable
test accounts/bottles cleaned up via `npx prisma db execute` afterward —
matches the established no-browser-automation workflow — but the *visual*
result of items 1 and 2 below (does the drift animation actually look right
now, does the letter cascade look good) is still only user-confirmed for the
bug report itself, not yet re-confirmed after the fix.

### 1. Fixed the send-drift animation cutting off early
`RoomView` was unmounting `MessageInput` the instant the send request
resolved (swapping straight to `BottleReleased`), killing the bottle icon's
7-second CSS drift (`lib/driftTiming.ts`) after under a second. `MessageInput`
now stays mounted through the release — a new `hideControls` prop hides just
the text field/send button — so the icon finishes its drift while
`BottleReleased` shows alongside it.

### 2. Persistent letter pile across visits
Replies used to only ever exist as physics letters during the single visit
that sent them — reopening a bottle always started from an empty canvas.
`lib/rooms.ts#getOrCreateRoom` now fetches up to the last 60 messages
(`PILE_HISTORY_LIMIT`) instead of just the latest one; `RoomView` treats the
newest as the readable note (unchanged) and replays everything older as a
staggered (~90ms apart) cascade of falling letters on mount, so a bottle's
sediment now visibly grows every time someone replies.

### 3. Dashboard redesign — no more spoilers, unread tracking
`app/dashboard/page.tsx` no longer dumps every message's raw text in a bare
list. Each bottle is now a card (`bottle1/2/3.png` cycled by index, name/slug,
public/private, message count) — you have to open a bottle to read what's in
it. Added `Room.lastReadAt` (migration `20260717151157_room_last_read_at`):
visiting a bottle as its owner (`app/[slug]/page.tsx`) marks it read; the
dashboard shows a red dot + "· new" when the latest message postdates it.

### 4. Delete vs. release a bottle
Bottles are two-way once replied to, so a hard delete would destroy the other
person's message without their say. `DELETE /api/rooms/[slug]`
(`app/api/rooms/[slug]/route.ts`) now branches on `lib/rooms.ts`'s new
helpers: `deleteEmptyRoom` (hard delete, only when message count is 0) vs.
`releaseRoomOwnership` (clears `ownerId`, leaves the room/messages intact and
still reachable by URL — just drops off the owner's dashboard). Dashboard
cards get a small "×" (`components/RemoveBottleButton.tsx`) with a
`window.confirm` whose copy differs per case.

### 5. Sign-in page bottles now link to real bottles
`lib/rooms.ts#getRandomPublicRoomSlugs(limit)` samples real public bottle
slugs; `app/page.tsx` fetches up to 7 and passes them into
`components/BottlePhysics.tsx`, which now tags each decorative bottle body
with a real slug (`lib/physics/bottleField.ts#spawnBottle`'s new `slug` param)
and navigates there on click — falls back to `/preview` only when there are
zero public bottles yet.

### 6. Reply-time "make this private" option
Replying to a public bottle now shows a toggle — "keep this just between us
instead of public?" — in `components/MessageInput.tsx` (only rendered when
the bottle is currently public). `POST /api/messages` accepts an optional
`makePrivate` flag and calls the new `lib/rooms.ts#makeRoomPrivate` (sets
`isPublic: false`) after the message is created; verified the room stops
appearing via `/api/rooms/random` immediately after. `RoomView` tracks this
locally so the release confirmation shows "Delivered." (private copy) instead
of the public "find another bottle" link when the toggle was checked.

### 7. Deploy prep
`npm run build` confirmed clean (Turbopack production build, typecheck, all
12 routes). `package.json` already has `"postinstall": "prisma generate"`, so
a fresh Vercel build will regenerate the client automatically. No separate
migration step is needed for first deploy — production will point at the
same Neon database that dev has already been migrating against directly all
session.

## What got built 2026-07-17d (live deploy, mobile, feedback/admin, diary, bugfixes)

The app is now **live**: **https://msg-in-a-bottle.vercel.app/**, deployed
from `Jolin-ma/Msg-In-A-Bottle` main via Vercel's GitHub integration (auto-
deploys on every push). Production points at the same Neon database dev has
been using all along — there's only one database, not separate dev/prod.
Almost everything below was verified against it directly (via `curl`, using
disposable test accounts cleaned up afterward, same as prior sessions) both
locally and in production, since most routes don't require auth to view.

### 1. Deployment
- Vercel project created via GitHub import (had to fix a one-time GitHub App
  permission gap — Vercel's app wasn't installed on the account yet).
- Env vars (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`) set from the local `.env` values.
- `AUTH_GOOGLE_ID` had a trailing-space typo in Vercel's dashboard the first
  time (Google OAuth failed with "OAuth client not found") — caught by
  inspecting the actual `client_id` in the redirect URL via `curl`, fixed by
  re-entering the value and redeploying.
- Google Cloud Console needed the production callback URL added
  (`https://msg-in-a-bottle.vercel.app/api/auth/callback/google`) alongside
  the existing `localhost:3000` one.
- Learned: Vercel deployments occasionally have a brief propagation window
  right after a push where a route 404s or an old code path still runs —
  not a real bug, just wait ~30-60s and retry before concluding something's
  broken.

### 2. Mobile responsiveness
- **Real bug, not cosmetic**: tapping a decorative bottle on the sign-in page
  did nothing on actual touchscreens. Matter.js's own `Mouse` calls
  `preventDefault()` on `touchstart`/`touchend` for the canvas, which
  suppresses the browser's synthetic `mousedown`/`mouseup` compatibility
  events — `BottlePhysics.tsx`'s click-vs-drag detection relied on those.
  Fixed by switching to Pointer Events, which aren't part of that
  suppression.
- Several panels used `width: min(NNvw, ...)` while sitting inside a padded
  fixed-position parent — `vw` always measures the raw viewport regardless
  of the parent's padding, so on narrow phones these computed wider than the
  space actually available, clipping content at the edge. Fixed by switching
  to `min(100%, ...)` everywhere this pattern showed up.
- `MessageInput` shrinks font/icon under 420px; `ContactInfo`'s email field
  bumped to 16px (below that triggers iOS Safari's zoom-on-focus); touch
  targets on the modal close button and dashboard delete "×" enlarged to
  ~40-44px (were ~24px); `BottleMessage` font-size now `clamp()`'d.

### 3. Feedback pipeline + admin Operations Dashboard
- `ContactInfo`'s mailto link (leaked the owner's real email in page source)
  replaced with a centered modal form (`POST /api/feedback`) — optional
  contact email for a reply, otherwise anonymous. Present on both the
  sign-in page and `/dashboard`.
- New `/admin` page, gated to one hardcoded admin email
  (`lib/admin.ts`). Styled to match the site's own light/serif theme (an
  earlier dark "control room" version was scrapped after user feedback).
  Three sorting bays (Incoming / Bugs & Technical / Love & Inspiration),
  resolve/reopen status, archive/restore drawer, and a live drift-stream
  canvas at the top that cycles through the Incoming bay with a pause
  toggle.
- Schema: `Feedback` model with `status`, `category`, `archivedAt`.
  `PATCH /api/feedback/[id]` takes any combination of
  `status`/`category`/`archived` in one call.

### 4. Bottle-creation bugs
- **Shareable link didn't match the actual bottle.** `CreateBottleForm` built
  the `/welcome` share link from the raw, unsanitized slug input instead of
  the sanitized slug the server actually stored the room under (`"Dear Me"`
  vs. the stored `"dear-me"`). Copying and opening that link silently
  auto-created a brand-new *empty* room at the wrong slug (room pages
  upsert-on-visit) instead of opening the real bottle. Fixed by using the
  server's response slug for the share link instead of the client's raw
  input.
- **No way to actually write the bottle's message.** The second field on
  creation only ever became `Room.name` — a small caption, never an actual
  message — so a fresh bottle always opened empty, prompting the *recipient*
  to write the first note (backwards for a bottle meant to deliver something
  to someone). It's now a real "write your message" textarea whose text
  becomes the bottle's first message via `Room`'s new optional
  `initialMessage` in `createOwnedRoom`.
- Public bottle creation removed entirely from the form — bottles are always
  private now (`isPublic: false` always sent); the visibility toggle became a
  purely cosmetic tagline pair instead ("A private harbor — a letter for
  someone" / "Diary — a secret cast to the sea").

### 5. Digital diary feature
- New `/diary` route: a private, one-per-account personal journal, separate
  from the bottle-exchange system (`DiaryEntry` model — deliberately not
  reusing `Room`/`Message`, since a diary needs none of the public/private,
  ownership-release, or reply-privacy machinery bottles carry).
- The bottle-creation "Diary" tagline option was later made to *actually*
  persist — `Room.isDiary` (real field, not just cosmetic) — so a bottle
  created that way is dashboard-labeled "diary" and its room page renders
  via a new `DiaryRoomView` (same physics/letter-pile visuals as `DiaryView`,
  posting to the existing `/api/messages` instead of `/api/diary`) — entries
  just accumulate, no seal/redirect after each one.
- Diary compose box: a `<textarea>` (not `<input>`) so Enter inserts a
  newline instead of submitting — single-line inputs auto-submit a form on
  Enter, textareas don't. Has a bobbing bottle icon next to "add entry."
- **Letter-pile ceiling** (keeps a tall pile from covering the compose box):
  first attempt added a full-width static physics body as a "ceiling" — this
  was wrong, it caught every letter immediately on the way down and nothing
  ever reached the real floor, since it sat directly in the fall path. Fixed
  by *not* touching the fall path at all: `PhysicsCanvas` now takes an
  optional `getCeilingY` callback, checked every 250ms, that removes only
  already-*settled* (near-zero speed) letters found above the line —
  actively-falling letters are never touched. The line itself is measured
  live off the compose box's real `getBoundingClientRect()`, not a guessed
  viewport-height fraction, with a 100px buffer above it.
- Message stack (`BottleMessage`) changed from showing only the single
  latest message to showing *all* of a bottle's messages stacked
  chronologically (oldest → newest), each with a date/time stamp — matters
  most for diary bottles where you want to read the whole running log.
  Capped at a max-height with internal scroll (soft-faded edges) so a long
  history can't grow into the reply/compose box below it, regardless of
  bottle length.
- `RoomSlugMarker`'s back-button + owner caption can run tall; the message
  stack's top offset is now `max(8%, 140px)` instead of a bare percentage,
  which could shrink below the caption's height on short mobile screens and
  overlap it.
- `MAX_LETTER_BODIES` (decorative pile cap, safe to trim — nothing lost) went
  300 → 150 → 450 over the course of tuning; landed on 450.

## What got built 2026-07-17e (decorative bottles cleaned up, in-app feedback replies, admin tooling)

### 1. Decorative sign-in bottles are now purely decorative
- `BottlePhysics.tsx` no longer takes bottle slugs or navigates anywhere on
  click — the 7 bottles on the sign-in page only respond to Matter's drag
  constraint now. Removed the pointer-click hit-test, `router.push`, and
  `getRandomPublicRoomSlugs` (deleted from `lib/rooms.ts`, was only used
  here). Cursor over the canvas changed `pointer` → `default`.
- Also dropped `cursor: pointer` from the three `AuthForm` buttons (Sign in,
  Sign in with Google, New here...) — a standing preference surfaced this
  session: this app doesn't use the hand/pointer cursor anywhere, buttons
  included, favoring the plain arrow throughout.
- `MessageInput`'s reply box (`Write your reply...`) got the same
  `border-bottom` underline the diary compose row already had, for visual
  consistency between the two.

### 2. Feedback replies — admin can now respond, in-app
First attempt at this misread the ask (built a "reply to a bottle message"
panel on `/dashboard` instead of "admin replies to feedback") — caught
before committing, discarded, rebuilt against the right target.
- Schema: `Feedback` gained `userId` (optional link to the submitting
  account), `adminReply`, `adminReplyAt`, `replyReadAt`. Migration
  `20260718023530_add_feedback_reply` applied to the live Neon DB (same DB
  dev and prod share, as established last session).
- `lib/feedback.ts`: `createFeedback` now takes a `userId`;
  `updateFeedback`'s `reply` field sets `adminReply`/`adminReplyAt` and
  resets `replyReadAt` to null (so re-replying re-flags it unread);
  `getFeedbackForUser`, `markFeedbackReplyRead`, `getUnreadFeedbackCount`,
  `deleteFeedback` added.
- Admin side (`OperationsDashboard.tsx`, `/admin`): each expanded card for
  feedback tied to an account (or with a manually-entered contact email)
  gets a reply textarea + send/update button; sent replies show inline.
  Card source line now shows the submitter's actual account email
  (`user.email`, joined in `getAllFeedback`) when there is one. Delete
  button (with confirm) added to both active and archived cards —
  `DELETE /api/feedback/[id]`, admin-only.
- User side (`ContactInfo.tsx`, the "Questions or feedback? Get in touch"
  trigger): fetches `/api/feedback/mine` on mount; shows a small red dot on
  the trigger when there's an unread admin reply; opening the modal shows
  the reply thread(s) above the compose form and marks them read
  (`PATCH /api/feedback/[id]` with `{ markRead: true }`, ownership-checked
  via `updateMany({ where: { id, userId } })` rather than a separate
  lookup).
- `ContactInfo` removed from the sign-in page entirely — it's dashboard/
  account-only now, since a reply can only ever reach someone with an
  account. Also dropped the manual "your email (optional, for a reply)"
  field from the compose form for the same reason: the account's email is
  already attached server-side, no need to ask for it.
- New route `app/api/feedback/mine` (GET, empty array if logged out — no
  401, keeps the client simple). `PATCH /api/feedback/[id]` now branches on
  `markRead` (any authed user, ownership-checked) vs. the admin-only
  status/category/archived/reply update it already had.
- Gap found via real usage: the reply box was initially gated on
  `entry.userId` only, which hid it for feedback submitted before this
  feature existed (no linked account, just a legacy contact email). Fixed
  to show whenever there's *any* way to reach the person
  (`userId || contactEmail`), with a note that email-only replies aren't
  delivered in-app and have to be sent manually.

### 3. Admin dashboard layout
- The "incoming, drifting in" live drift-stream canvas (`LiveFeedbackStream`)
  went through three passes in one session: height bumped 110px → 170px
  first (bottles were bobbing low enough to clip against the panel's
  `overflow: hidden`), then just the label text removed per a follow-up
  ask, then the whole section removed and the now-unused component deleted
  outright per a final ask for more room. Net result: gone.

### 4. Local admin tooling (outside the Next.js app, on the user's PC)
- Desktop shortcut **`Admin Dashboard.lnk`** → `https://msg-in-a-bottle.vercel.app/admin`,
  with a custom icon rendered from `app/icon.png` (256×256, PNG-in-ICO,
  hand-built via a `BinaryWriter` script since there's no ImageMagick in
  this environment) — `C:\Users\jolin\Desktop\bottle-shortcut.ico`.
  Learned along the way: signing in never returns you to the page you were
  trying to reach — `AuthForm` hardcodes `callbackUrl: "/welcome"` for both
  Google and credentials sign-in — so hitting `/admin` while logged out
  bounces to `/` and, after login, lands on `/welcome`/`/dashboard`, not
  back at `/admin`. Not a bug in the admin gate itself; just re-click the
  shortcut once signed in.
- **Hourly desktop notification for new feedback**:
  `GET /api/feedback/unread-count` (new) authenticates via either the
  normal admin session or a shared-secret header (`x-admin-key` matching
  `ADMIN_API_KEY`), so a background script with no browser session can
  check it. `C:\Users\jolin\AdminNotifier\check-unread.ps1` polls that
  endpoint, tracks the last-seen count in a local state file, and pops a
  Windows balloon notification (using the bottle icon) only when the count
  has gone *up* since last check — avoids repeat alerts for the same
  still-unread message. Registered as Windows Task Scheduler task
  `MsgInABottle-UnreadCheck`, hourly. `ADMIN_API_KEY` lives in the local
  `.env` (gitignored) and was manually added to Vercel's Production env
  vars by the user (not settable from here — this Vercel project isn't
  reachable through the connected Vercel MCP account/team, confirmed via a
  404 on `get_project`). Confirmed working end-to-end in production: a real
  feedback submission triggered a real balloon notification on manual task
  run.

### Verified
Same no-browser-automation workflow as prior sessions: `tsc`/`eslint`/
`next build` clean after each change; `curl` end-to-end runs against the
local dev server with disposable test accounts/data (registered, exercised,
deleted via `npx prisma db execute` afterward) for anything curl-able
(session handshake, feedback submit/reply/read/delete, auth boundaries on
each new route); for admin-only actions that need a real Google OAuth
session curl can't complete, exercised the same `lib/feedback.ts` functions
the routes call directly via disposable `npx tsx` scripts (pattern already
established in `lib/rooms.ts` testing) instead. Two mid-session cache traps
hit again this session (same class of issue as before): a stale `next
start` production build serving pre-edit code, and a dev server holding a
stale generated Prisma Client in memory after a schema-driven
`prisma generate` — both fixed by restarting the dev server, not by
changing app code.

## What got built 2026-07-18 (public bottles sunset)

Decided against building the Resend/custom-domain email path from the prior
session's blocked list — admin replies stay in-app only, for account users;
the domain is set in Vercel but Resend integration is intentionally not
happening. Instead, fully removed the public-bottle concept that had been
dead/half-wired since 2026-07-17e (creation already only produced private
bottles; the sign-in page's decorative bottles no longer linked anywhere):

- `Room.isPublic` dropped from the schema entirely — migration
  `20260718233132_remove_room_is_public` applied directly to the shared
  Neon DB (6 existing non-null rows lost their value on this column, all
  other data untouched; confirmed via the same disposable-test-data curl
  workflow as prior sessions, cleaned up after).
- `lib/rooms.ts`: removed `makeRoomPrivate` and `getRandomPublicRoom`;
  `createOwnedRoom` dropped its `isPublic` parameter entirely (now just
  `slug, ownerId, initialMessage?, isDiary?`).
- Deleted `lib/randomBottle.ts` and `app/api/rooms/random/route.ts` (its own
  route) — hitting `/api/rooms/random` now just falls through to the
  dynamic `[slug]` route with slug `"random"`, same as any other unknown
  slug; confirmed via curl.
- `components/BottleReleased.tsx`: dropped the `isPublic` prop and the
  "[find another bottle]" link — always just shows "Delivered."
- `components/MessageInput.tsx`: removed the reply-time "keep this just
  between us instead of public?" toggle and its `isPublicBottle`/
  `makePrivate` state; `onSubmit` is back to a single-arg `(text)` callback.
- `components/RoomView.tsx`, `app/[slug]/page.tsx`, `app/api/messages/route.ts`,
  `app/api/bottles/route.ts`, `components/CreateBottleForm.tsx`: all
  `isPublic`/`makePrivate` plumbing removed end to end.
- `components/WelcomePanel.tsx` / `app/welcome/page.tsx` /
  `app/preview/welcome/page.tsx`: dropped the `isPublic` prop and the public-
  vs-private copy branch — always shows the "sealed just for whoever has
  this link" copy, since that's the only kind of bottle that exists now.
- Dashboard bottle-card meta line simplified from
  `isDiary ? "diary" : isPublic ? "public" : "private"` to
  `isDiary ? "diary" : "private"`.
- Verified: `tsc --noEmit`, `eslint`, `next build` all clean (had to clear a
  stale `.next` cache once — its generated route-type validator still
  referenced the deleted `/api/rooms/random/route.ts` after the file was
  removed); `next build`'s route list confirms `/api/rooms/random` is gone.
  curl end-to-end against the dev server: posting `makePrivate` to
  `/api/messages` is now silently ignored (no error, no effect), bottle
  creation no longer sends `isPublic`, `/preview`, `/preview/welcome`,
  `/preview/dashboard` all still 200. Disposable test rooms/messages
  cleaned up via `npx prisma db execute` afterward.

### Custom domain + a real production incident
- `msg-in-a-bottle.com` was bought directly through Vercel (not
  Namecheap as the prior session assumed) and was already fully wired —
  both `msg-in-a-bottle.com` (308 → `www`) and `www.msg-in-a-bottle.com`
  showed "Valid Configuration" in Vercel's dashboard on first check, no
  DNS work needed. Confirmed live via curl.
- Learned the `msg-in-a-bottle` Vercel project *is* reachable through the
  connected MCP account after all — `list_projects` on team
  `team_r3npDTM0Jz3NaEbHJAIWrfwF` (`legacylinkstudio`) doesn't surface it,
  but `get_deployment`/`get_runtime_errors`/etc. resolve fine once you
  already have its project ID (`prj_Q41cjkaHq4PLAWdsUpNzLk09Uwiz`) or hit
  it by deployment URL directly. Corrects the "not reachable at all" note
  from the prior session — worth trying direct-by-ID/URL calls before
  concluding a project is out of reach just because it's missing from a
  list call.
- **Incident**: committing the schema migration above (dropping
  `isPublic` from the live Neon DB) without also committing/pushing the
  matching code change broke production for ~10 minutes (2026-07-18
  23:40–23:50 UTC, 9 users affected) — every `/dashboard` and bottle-page
  visit threw `PrismaClientKnownRequestError P2022` (`column "isPublic"
  does not exist`) because the still-deployed old code's
  `getOrCreateRoom` upsert still wrote `isPublic: true`. Caught via
  `get_runtime_errors` after the user reported `/dashboard` "not
  loading." Fixed by committing and pushing the already-written code
  changes (commit `7a26494`); Vercel auto-deployed and the error stopped
  immediately, confirmed via `get_runtime_errors` showing zero new
  occurrences against the new deployment ID.
  **Rule going forward: never run a schema migration against the shared
  Neon DB in isolation — commit and push the matching code in the same
  breath, since Vercel's auto-deploy is the only thing keeping deployed
  code in sync with a database both dev and prod share live.**

### Privacy policy overlay + account deletion
- New `components/PrivacyPolicy.tsx`: a tiny, faint `[privacy]` link
  (bottom-left, mirroring `ContactInfo`'s bottom-right "Get in touch"
  trigger) on the sign-in screen (`app/page.tsx`) and the dashboard.
  Clicking it opens a centered, scrollable overlay (soft-faded scroll
  edges, closes on backdrop click or Escape) with the user-supplied
  policy copy verbatim.
- The policy text promises an in-settings "permanent wipe" option, which
  didn't exist yet — added it for real rather than shipping a policy that
  overclaims: `lib/account.ts#deleteUserAccount` + admin-auth-gated
  `DELETE /api/account` + a "Delete my account" link
  (`components/DeleteAccountButton.tsx`) in the dashboard header next to
  the email. Deleting just calls `prisma.user.delete` — the schema's
  existing FK constraints do the rest: `DiaryEntry` cascade-deletes (its
  relation is `onDelete: Cascade`), while owned `Room`s and `Feedback`
  just lose their owner link (`onDelete: SetNull`), matching the
  established "release a bottle" precedent — a bottle already replied to
  is a two-way exchange, so it stays live at its link for whoever has it
  rather than disappearing out from under them. Client calls `signOut()`
  right after so the session cookie doesn't linger locally.
- Verified end-to-end against the dev server with a disposable account:
  created a bottle + a diary entry, deleted the account, confirmed (a)
  the diary entry was gone (queried directly via a throwaway `tsx`
  script — `npx tsx --env-file=.env` was needed since plain `tsx` doesn't
  pick up `.env` the way Next.js does), (b) the bottle survived with
  `ownerId: null`, (c) the email became immediately re-registerable, (d)
  no `tsc`/`eslint`/`next build` regressions. No schema migration
  involved this time, so no repeat of the incident above.

### Diary "float away" + per-bottle icon choice
- The diary compose row's bobbing bottle icon now plays the same
  randomized float-away drift the bottle-reply flow already had, every
  time "add entry" is pressed — extracted the drift-path generator out
  of `MessageInput.tsx` into a shared `lib/driftStyle.ts` (was about to
  be duplicated a third time). Unlike the reply flow, which navigates
  away right after, diary composing continues indefinitely, so the icon
  resets to bobbing after `DRIFT_DURATION_MS` — done by keying the
  `<img>` on an incrementing `flightId` so React remounts it each send,
  restarting the CSS animation cleanly (`components/DiaryView.tsx` and
  `components/DiaryRoomView.tsx`, both share `DiaryView.module.css`).
- `Room.iconIndex` (new `Int @default(0)` column, migration
  `20260719001823_add_room_icon_index`) makes a bottle's dashboard icon
  a real per-bottle choice instead of just cycling `bottle1/2/3.png` by
  list position. This one was additive/non-destructive, so — unlike the
  `isPublic` removal earlier this session — running it alone didn't risk
  breaking the still-deployed old code, confirmed no runtime errors
  appeared before the matching app code was pushed.
- UX went through two iterations before landing: first an inline
  three-icon row in `CreateBottleForm` itself, then per user request
  moved to a popup that opens when "+ New bottle" is pressed (icons
  picked from `lib/bottleIcons.ts#BOTTLE_ICONS`, shared with the
  dashboard's render so both read from one source of truth) — explicitly
  to leave room for eventually gating some bottle styles behind a paid
  unlock, though no pricing/locking logic was built now, just the plain
  array structure that's easy to extend later.
- Along the way, fixed a real pre-existing bug surfaced by manual
  testing: leaving the name field empty and pressing "+ New bottle" did
  nothing with zero feedback (a silent early-return with no error
  shown) — now shows "Name your bottle first."
- Verified end-to-end against the dev server: valid `iconIndex` stored
  correctly, out-of-range value rejected 400, the dashboard renders the
  exact chosen icon (checked by inspecting the rendered HTML for a
  specific bottle's `<img src>`, not just an aggregate count) — plus
  `tsc`/`eslint`/`next build` clean, disposable test data cleaned up
  after. One dead end during debugging: after the UX iteration, the
  popup appeared not to open at all in the user's manual test; turned
  out to be the empty-name silent-return bug above rather than a stale
  build, though `.next` was cleared and the dev server restarted anyway
  as a precaution (matches the recurring stale-cache gotcha from prior
  sessions) before confirming the real cause.

## Blocked / next steps

- Resend/custom-domain email for feedback replies to non-account users is a
  deliberate non-goal for now (decided 2026-07-18) — admin replies stay
  in-app only, for people with an account. Revisit only if that constraint
  changes.
- `PILE_HISTORY_LIMIT` (60, in `lib/rooms.ts`, separate from
  `MAX_LETTER_BODIES`) is still an unvalidated guess at how many past
  messages are worth fetching/replaying per room open — same caveat as
  before, first knob to turn if a heavily-replied bottle ever feels slow.
