# Continuation: Admin Dashboard UI Redesign (sidebar layout)

> Resume after `/clear`: be on branch **`feat/admin-dashboard-ui`**, then "continue the dashboard redesign" and read this file. Verify with `npx tsc --noEmit` + a browser check (login at `admin.localhost:<port>`), then fast-forward merge to `main` + push.

## Goal
Replace the current single-column admin page with a **sidebar dashboard** (ref: "Coastal Serenity" screenshots), **white-labeled to BiNuKBoK**, brand colors navy/teal/cream. Owner is 40+ → big text (≥16–17px), high contrast, large tap targets (≥48px).

## Locked scope — KEEP only these (data-backed)
- **Sidebar** nav: Overview · Bookings · Account. White-label wordmark "BiNuKBoK / VieW PoiNT". Admin profile (email + "Admin") at sidebar bottom.
- **Overview** page: 3 KPI cards (Arrivals today · Awaiting deposit · In-house now — 3rd card dark navy) + "Awaiting deposit" list (Confirm) + "Arrivals today" list (Mark arrived / Check out).
- **Bookings** page: search (name/code/phone) + results with status pills + contextual actions; plus the Awaiting-deposit + all-bookings management.
- **Account** page: admin email (credentials), **change password** (Supabase `auth.updateUser`), **sign out**.

## CUT (no data / unnecessary, per owner)
Revenue/forecast cards, Daily Revenue, Facility Status (pool/spa/gym), Pending Actions/invoices, Facility notices, Quick Booking Portal/walk-in, Calendar nav, Resort Config nav. Do NOT add these.

## Current state (nothing broken; `main` intact)
- Branch `feat/admin-dashboard-ui` (off `main`). One file created (uncommitted): `app/admin/_components/ui.tsx` — exports `Kpi({value,label,dark})`, `Card({title,hint,count,action,children})`, `Row({name,lines,code,pill,action})`, `Empty`, `StatusPill({status})`. Reuse these.
- Existing on this branch (from main):
  - `lib/db/admin.ts`: `getDashboardCounts()` → `{arrivalsToday, awaitingDeposit, inHouse}`; `getArrivals()`; `getPendingDeposits()`; `searchBookings(q)`; `verifyDeposit/markArrived/markCompleted/markArrivedByCode`. All return `LIST_SELECT` shape (guest.fullName/phone/email, roomUnit.label+roomType.name, checkIn/checkOut, nights, depositAmount, totalPrice, confirmationCode, status, diveAddons).
  - `app/admin/actions.ts`: `signInAction`, `signOutAction`, `verifyDepositAction/markArrivedAction/markCompletedAction` (signature `(prev: RowState, formData) => RowState`), `RowState`, `adminPath(sub)` helper (host-aware).
  - `app/admin/_components/BookingActionRow.tsx` (client, useActionState feedback), `BookingSearch.tsx` (client, debounced `/?q=`).
  - `app/admin/page.tsx` = OLD single-column dashboard (DELETE when moving to the route group — else route conflict with `(app)/page.tsx`).
  - `app/admin/login/page.tsx`, `app/admin/layout.tsx` (minimal: noindex metadata + `min-h-screen bg-cream`). Login must stay OUTSIDE the sidebar.

## Build steps (remaining)
1. **`app/admin/_components/Sidebar.tsx`** (client). White-label wordmark. Nav items use `/admin` hrefs: Overview `/admin` (Icon Home), Bookings `/admin/bookings` (Icon Calendar), Account `/admin/account` (Icon Users) — all from `@/components/Icons`. Active state: `const norm = usePathname().replace(/^\/admin/, "") || "/";` then compare to each item's norm (`"/"`, `"/bookings"`, `"/account"`) — this works on BOTH the subdomain (clean paths) and localhost (/admin paths). `hidden md:flex w-64` aside; admin email passed as prop → avatar (first letter) + email + "Admin" at bottom.
2. **`app/admin/(app)/layout.tsx`** — `const admin = await requireAdmin();` then `<div className="flex min-h-screen bg-cream"><Sidebar email={admin.email??""} /><main className="flex-1 overflow-x-hidden">{children}</main></div>`. (Route group `(app)` so login stays outside the sidebar.)
3. **`app/admin/(app)/page.tsx`** — Overview (Kpi×3 + two Cards with Rows + BookingActionRow), `export const dynamic = "force-dynamic"`. Date fmt: `new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"UTC"})`.
4. **`app/admin/(app)/bookings/page.tsx`** — `({searchParams}: {searchParams: Promise<{q?:string}>})`; `<BookingSearch />` + results (searchBookings) with StatusPill + Awaiting-deposit Card (verifyDepositAction). force-dynamic.
5. **`app/admin/(app)/account/page.tsx`** — show `admin.email`; `<form action={signOutAction}>` sign-out; a **ChangePassword** client component + `changePasswordAction` (add to actions.ts): `requireAdmin()` then `(await createClient()).auth.updateUser({ password })`; min length 8; return `{ok,message}` via useActionState.
6. **DELETE `app/admin/page.tsx`** (avoid /admin route conflict).
7. Topbar per page: title (e.g. "Overview") — optional small header row.
8. `npx tsc --noEmit` (exit 0) → browser verify (login, see sidebar + Overview KPIs, click an action, check Bookings search + Account) → commit per coherent chunk → `git checkout main && git merge --ff-only feat/admin-dashboard-ui && git push origin main`.

## Notes / gotchas
- **Only ONE `pnpm dev`** at a time (shared `.next`; two servers corrupt it → `__webpack_modules__ is not a function`). If corrupted: stop servers, delete `.next`, restart one.
- Admin reached via `admin.localhost:<port>` (middleware rewrites). Login creds for testing: `mannydcgarces@gmail.com`.
- `.env` has real Supabase + OPENAI keys (gitignored).
- **Separate pending work (different branch `feat/admin-ai-assistant`):** AI availability chatbot — backend works (`POST /api/chat 200`), but the chat UI doesn't render the streamed answer (AI SDK v6 `useChat` client issue). NOT part of this redesign.

---

## ⚠️ Scope change — "Coastal Serenity" full clone (2026-05-25, branch `feat/admin-dashboard-cs-redesign`)

> **This REVERSES the locked "CUT — per owner" list above.** Decision made by the developer (intern), NOT the owner. **Requires owner (`mannydcgarces`) sign-off before merging to `main`** (Vercel auto-deploys main). Built on a feature branch only.

The owner had cut Revenue, Facility Status, Pending Actions/Invoices, and the Calendar + Resort Config nav. The developer asked to clone the full Coastal Serenity reference dashboard anyway. We honored it with guardrails:

- **Live data** (real): arrivals table, expected-arrivals count, bookings search, awaiting-deposit + Confirm action.
- **Mock/demo data** (NO live source — see `app/admin/_components/demo.ts`): Daily Occupancy, Daily Revenue, Facility Status, Pending Actions. Clearly disclosed via an amber banner on Overview + an exhaustive comment block in `demo.ts`. Each is annotated with the real query that should replace it.
- **New placeholder routes:** `/admin/calendar`, `/admin/resort-config` ("Coming soon").
- **New shell:** light CS-style sidebar (5 nav items), sticky Topbar (bell/search/LIVE), mobile nav strip, CS card components in `app/admin/_components/cs.tsx`.

**Reviewed by Noxa's Dev Team** (Gemini UI/UX, Jazelei FE, Franco QA). High-consensus fixes applied: mobile nav (sidebar was desktop-only), dead-affordance Pending Actions made non-interactive, demo banner enlarged + iconned, focus rings, shared nav module, tablet KPI breakpoint. **Rejected** (technically wrong for this data model): changing `timeZone:"UTC"` → `Asia/Manila` on the date formatters — `checkIn/checkOut` are Prisma `@db.Date` columns returned at UTC-midnight, so UTC formatting renders the correct calendar date (matches the existing convention on `main`).

**Deferred / known gaps:** Topbar still rendered per-page (minor duplication, not breaking); table cell truncation for very long names (mitigated by horizontal scroll); the "LIVE" badge + bell are presentational.
