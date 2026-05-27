# Admin Floating Quick Tools — Design

**Date:** 2026-05-27
**Status:** Approved (brainstorming → ready for plan)
**Scope:** UX refactor of the admin area. Move AI Assistant and Check-in Scanner off dedicated nav tabs and into a global floating speed-dial FAB available from every admin page.

## Problem

The current admin nav has 7 tabs, two of which feel misplaced:

- **AI Assistant** (`/admin/ai`) is a sidekick — staff want to ask "is the Kubo free this weekend?" *while* looking at bookings or the calendar, not by navigating away to a dedicated chat page.
- **Check-in scanner** (`/admin/scan`) is a quick action — open camera, scan QR, done. A whole route + tab for a 5-second action overweights it and clutters the sidebar.

Both also break the "stay on the page you're working on" mental model.

## Goals

- Make AI chat reachable from anywhere in the admin area in one tap.
- Make Check-in scanner reachable from anywhere in the admin area in one tap.
- Preserve AI chat conversation when staff close the panel or navigate between pages.
- Free up two sidebar slots; reduce nav from 7 to 5 items.
- No backend changes. No new dependencies. No changes to `/api/chat` or `/api/scan`.

## Non-goals

- Persisting chat to localStorage / DB (still resets on hard refresh).
- Redesigning `AvailabilityChat` or `CheckInScanner` internals (camera, jsQR, useChat, rate-limiting all stay as-is).
- Adding deep-link routes back as a fallback. Old `/admin/ai` and `/admin/scan` URLs will 404.
- Touching the public site, the booking flow, or any non-admin route.

## Architecture

A single client component, **`AdminQuickTools`**, mounts once inside `app/admin/(app)/layout.tsx`. It owns three sub-surfaces and the open/close state for each:

```
app/admin/(app)/layout.tsx
└── <AdminQuickTools>                  ← new, client
     ├── <SpeedDialFab>                ← bottom-right, fixed
     ├── <AiPanel hidden={!aiOpen}>    ← always mounted (chat history persists)
     │    └── <AvailabilityChat />     ← existing component, unchanged logic
     └── <ScanModal open={scanOpen}>   ← mounted only when open
          └── <CheckInScanner />       ← so camera stream releases on close
```

Mounting at the `(app)` layout level means the panel and FAB exist on every authenticated admin page (Overview, Bookings, Calendar, Resort Config, Account). It also means `<AvailabilityChat />` is mounted exactly once across the whole admin session — `useChat` state survives panel close and route changes for free, no context/store required.

`<CheckInScanner />` is the opposite: it mounts only while the modal is open, so closing the modal fully unmounts it and the `getUserMedia` stream is released cleanly (the existing component already cleans up on unmount).

## Components

### SpeedDialFab
- **Collapsed:** one circular button, 56×56, `bg-teal text-white`, icon = `Sparkles`. Fixed at `bottom-4 right-4` (desktop), `bottom-20 right-4` (mobile — clears the existing mobile nav strip in `Topbar`). Respects `env(safe-area-inset-bottom)` on iOS Safari.
- **Expanded** (after tap): two labelled pill buttons fan upward with a brief stagger animation.
  - **Scan check-in** — `ScanLine` icon.
  - **Ask AI** — `Sparkles` icon.
  - Labels always visible on mobile; hover/focus reveals labels on desktop (or always-visible if it looks better — implementer's call).
- **Interactions:** Tapping an action closes the speed dial and opens the corresponding surface. Backdrop tap or `Esc` closes the speed dial without opening anything.
- **A11y:** Primary button uses `aria-expanded` and `aria-controls`. Each fan-out action has a clear accessible name. Focus traps inside the expanded state and returns to the primary button on collapse.

### AiPanel (right-side slide-in)
- **Desktop:** `fixed right-0 top-0 h-screen w-[420px]`, slides in via `translate-x` transition. Page content stays visible to the left — no backdrop dim. Acceptable to *not* trap focus so staff can keep clicking the page; close-on-Esc still works.
- **Mobile (<md):** full-screen sheet (translate from right or bottom — implementer's call, prefer right for consistency).
- **Header:** "Availability assistant" title, close (X) button, and a **Clear chat** icon button (resets the `useChat` conversation without unmounting the component — calls `setMessages([])`).
- **Body:** the existing `<AvailabilityChat />` exactly as is, with one tweak: drop the `h-[calc(100vh-13rem)] min-h-[28rem]` height calculation (it was page-sized) and replace with `h-full` so the chat fills the panel.
- **Closes on:** X button, Esc. No backdrop dim and no backdrop click (page stays interactive on desktop; mobile panel is full-screen so there's nothing to backdrop).
- **Persistence:** does **not** unmount on close — uses `hidden` attribute + `translate-x-full` so `useChat` history survives.

### ScanModal (full-screen)
- **Desktop:** backdrop dim (`bg-navy/40 backdrop-blur-sm`) + centered card containing the scanner.
- **Mobile:** full-screen sheet.
- **Body:** the existing `<CheckInScanner />`, no behavior changes.
- **Closes on:** X button, Esc, "Done" tap after a successful check-in. Closing unmounts the scanner so the camera stream stops.
- **Bonus:** on successful check-in, surface a brief in-modal success state (existing component already shows scan results) and let the user tap "Scan another" or "Done". No toast system exists yet — out of scope to add one.

## Cross-component contract (how anything triggers the FAB tools)

`AdminQuickTools` exports two trigger helpers:

```ts
export const openAdminScan = () => window.dispatchEvent(new Event("admin:open-scan"));
export const openAdminAi   = () => window.dispatchEvent(new Event("admin:open-ai"));
```

`AdminQuickTools` registers `window.addEventListener("admin:open-scan", ...)` and `"admin:open-ai"` listeners in a `useEffect`, which toggle the relevant open state. Any component anywhere in the admin tree can import and call these helpers without prop-drilling or context. Easy to extend later (e.g. `admin:close-all`, `admin:focus-scan`) and easy to remove if we later prefer a Context-based API.

## Files touched

**New**
- `app/admin/_components/AdminQuickTools.tsx` — FAB + AiPanel + ScanModal + event wiring + trigger helpers.

**Edit**
- `app/admin/(app)/layout.tsx` — mount `<AdminQuickTools />` once, after `<main>`.
- `app/admin/_components/nav.ts` — remove the `/admin/scan` and `/admin/ai` entries from `ADMIN_NAV`. Keep `ScanLine` and `Sparkles` icon imports (still used by the FAB).
- `app/admin/(app)/page.tsx` — Check-in Center KPI card currently has `ctaHref="/admin/scan"` (line 60). Replace with `ctaOnClick={openAdminScan}` (import from `AdminQuickTools`).
- `app/admin/_components/ui.tsx` — add optional `ctaOnClick?: () => void` prop to whichever KPI/card primitive renders the action chip. Render as a `<button>` when `onClick` is provided, fall back to `<Link>` when `href` is provided. Keep existing usage compiling.
- `app/admin/_components/AvailabilityChat.tsx` — one-line change: replace `h-[calc(100vh-13rem)] min-h-[28rem]` on the outer wrapper with `h-full min-h-0`.

**Delete**
- `app/admin/(app)/ai/` (folder, including `page.tsx`)
- `app/admin/(app)/scan/` (folder, including `page.tsx`)

## Error handling

- **AI panel:** `<AvailabilityChat />` already handles its own error display (`role="alert"` below the message list when `error` is set from `useChat`). No additional handling needed.
- **Scan modal:** `<CheckInScanner />` already handles camera permission errors, no-QR-found states, and API errors. No additional handling needed.
- **Custom event API:** event listeners are guarded by mount/unmount in `AdminQuickTools`'s `useEffect` cleanup. Dispatching `admin:open-scan` before the FAB is mounted is a no-op (acceptable — only possible during the initial layout render before hydration, which is before any user can click anything).

## Testing

No test runner is currently configured in this repo (per `CLAUDE.md`). Verification is manual + type/lint:

- `npx tsc --noEmit` passes (strict mode, no errors).
- `pnpm lint` passes with zero warnings (current baseline).
- Manual flow check in `pnpm dev` against `http://localhost:3000/admin`:
  - FAB visible bottom-right on Overview, Bookings, Calendar, Resort Config, Account.
  - Tap FAB → speed dial expands with two actions.
  - Tap "Ask AI" → right panel slides in, can converse with the assistant, panel closes on X / Esc, reopening shows previous conversation. Navigate to Bookings, reopen panel → conversation still there.
  - Navigate to a different admin page → conversation persists.
  - Tap "Scan check-in" → full-screen modal, camera activates, scan a test QR, modal closes, camera stream stops (check via DevTools → no active `getUserMedia` track).
  - Overview's "Check-in Center" KPI card action opens the scanner modal (does NOT navigate to a route).
  - Mobile viewport (<md): speed dial sits above the Topbar mobile nav strip, both panel and modal go full-screen, no clipping under the iOS safe area.
  - `/admin/scan` and `/admin/ai` return 404.
  - Sidebar shows exactly 5 items: Overview, Bookings, Calendar, Resort Config, Account.

## Risks and mitigations

- **Risk:** `<AvailabilityChat />` mounted at layout level fires a `/api/chat` request on every admin page load.
  - **Mitigation:** It only fires on user submit (via `useChat`'s `sendMessage`). Mounting the component does not hit the API. Verified by reading the component.
- **Risk:** Layout-mounted scanner leaves the camera on across navigation.
  - **Mitigation:** `<CheckInScanner />` is *not* layout-mounted — it lives inside `<ScanModal>` and only mounts while `scanOpen === true`.
- **Risk:** Custom-event API feels exotic.
  - **Mitigation:** It's a deliberate trade for zero coupling. If we ever need typed payloads or a "close all" coordinator, swap to React Context behind the same `openAdminScan` / `openAdminAi` function signatures — no caller changes needed.
- **Risk:** Hard-refresh wipes chat — staff might find that surprising.
  - **Mitigation:** Explicit non-goal. If demand appears, follow-up spec can add `sessionStorage` persistence behind the same `<AvailabilityChat />` component (single seam).

## Out-of-scope follow-ups (not for this spec)

- Persisting chat to `sessionStorage` across refresh.
- A toast system for "Checked in: <guest>" feedback after scanning.
- Keyboard shortcuts (e.g. `Cmd+K` for AI, `Cmd+B` for scan).
- A "history" view of past scans inside the modal.
