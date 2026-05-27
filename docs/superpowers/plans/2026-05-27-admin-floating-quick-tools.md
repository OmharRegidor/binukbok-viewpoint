# Admin Floating Quick Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the admin AI chat and check-in scanner off dedicated nav tabs and into a single global floating speed-dial FAB available from every admin page. AI conversation persists across navigation.

**Architecture:** A single client component `AdminQuickTools` mounts once in the `(app)` layout. It owns a bottom-right speed-dial FAB plus two open surfaces: a right-side slide-in panel for `<AvailabilityChat />` (kept mounted so chat state survives) and a full-screen modal for `<CheckInScanner />` (mounted only while open so the camera stream releases on close). Any component can open either surface by calling exported helpers (`openAdminAi()`, `openAdminScan()`) which dispatch window `CustomEvent`s.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 (CSS-first, tokens in `app/globals.css`) · `@ai-sdk/react`'s `useChat` (existing) · `jsQR` via existing `CheckInScanner`.

**Source spec:** `docs/superpowers/specs/2026-05-27-admin-floating-quick-tools-design.md`

**No test runner exists in this repo.** Verification is `npx tsc --noEmit` + `pnpm lint` + manual browser smoke per task.

**Branch:** work directly on `main` (the existing admin work all ships from `main` per the repo's recent commit history). Commit per task.

---

## File Map

**New**
- `app/admin/_components/AdminQuickTools.tsx` — FAB + AiPanel + ScanModal + event wiring + `openAdminAi` / `openAdminScan` trigger helpers.

**Edit**
- `components/Icons.tsx` — add `Close` (X) and `RotateCcw` icons (used by FAB/panel headers).
- `app/admin/_components/AvailabilityChat.tsx` — accept an optional `onClear` prop (so the panel header's clear-chat button can reset `useChat`'s `messages`); change outer wrapper from page-sized height to fill-parent (`h-full min-h-0`).
- `app/admin/_components/cs.tsx` — `ExpectedArrivalsCard` accepts `ctaOnClick?: () => void` and renders a `<button>` instead of a `<Link>` when `onClick` is provided. (Spec said `ui.tsx` but the actual card lives in `cs.tsx` — same intent.)
- `app/admin/(app)/page.tsx` — Check-in Center KPI swaps `ctaHref="/admin/scan"` for `ctaOnClick={openAdminScan}`.
- `app/admin/(app)/layout.tsx` — mount `<AdminQuickTools />` once, after `<main>`.
- `app/admin/_components/nav.ts` — remove `Check-in` and `AI Assistant` entries from `ADMIN_NAV`.

**Delete**
- `app/admin/(app)/ai/` (folder, with `page.tsx`)
- `app/admin/(app)/scan/` (folder, with `page.tsx`)

Order is bottom-up: leaf primitives (icons, chat-clear hook, KPI prop) first so subsequent tasks compile cleanly; then `AdminQuickTools`; then layout mount; then re-target Overview; then nav cleanup; then route deletion; then final verification.

---

### Task 1: Add `Close` and `RotateCcw` icons

**Files:**
- Modify: `components/Icons.tsx` (append at end of file, before any trailing newline)

- [ ] **Step 1: Append two new icon components**

Add at the end of `components/Icons.tsx`:

```tsx
export function Close(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function RotateCcw(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add components/Icons.tsx
git commit -m "feat(icons): add Close and RotateCcw icons"
```

---

### Task 2: Make `AvailabilityChat` panel-friendly (fill parent + optional onClear)

The chat is currently sized to fill a page (`h-[calc(100vh-13rem)] min-h-[28rem]`). The panel will provide its own height, so the chat must fill its parent. We also expose an `onClear` callback so the panel header's clear-chat button can reset `useChat`'s `messages` without touching the component's internals.

**Files:**
- Modify: `app/admin/_components/AvailabilityChat.tsx`

- [ ] **Step 1: Update the component to accept `onClear` and fill its parent**

Edit `app/admin/_components/AvailabilityChat.tsx`:

Replace the `useChat()` destructure line with:

```tsx
  const { messages, sendMessage, status, error, setMessages } = useChat();
```

Just above the existing `function ask(text: string)`, add:

```tsx
  function clear() {
    setMessages([]);
    setInput("");
  }
```

Change the component signature from:

```tsx
export function AvailabilityChat() {
```

to:

```tsx
export function AvailabilityChat({ onClearReady }: { onClearReady?: (clear: () => void) => void } = {}) {
```

Inside the component body (above the `return`), add:

```tsx
  useEffect(() => { onClearReady?.(clear); }, [onClearReady]);
```

(The `eslint-disable-next-line react-hooks/exhaustive-deps` comment is not needed — `clear` is stable for this purpose and adding it as a dep would loop. If ESLint flags it, prepend `// eslint-disable-next-line react-hooks/exhaustive-deps` immediately above the `useEffect`.)

Finally, change the outer wrapper class from:

```tsx
    <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] flex-col rounded-2xl bg-white ring-1 ring-navy/5">
```

to:

```tsx
    <div className="flex h-full min-h-0 flex-col rounded-2xl bg-white ring-1 ring-navy/5">
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0, no warnings.

If lint warns about exhaustive-deps on the new `useEffect`, add `// eslint-disable-next-line react-hooks/exhaustive-deps` on the line directly above it and re-run.

- [ ] **Step 3: Commit**

```bash
git add app/admin/_components/AvailabilityChat.tsx
git commit -m "refactor(admin/chat): fill parent height and expose clear handle"
```

---

### Task 3: Add `ctaOnClick` to `ExpectedArrivalsCard` (and promote `cs.tsx` to client)

The Overview KPI currently uses a `<Link>` for its CTA. Add a button-mode so callers can trigger an action (like opening the scanner modal). The Overview page (Server Component) will pass `openAdminScan` as a prop in Task 9 — that requires `ExpectedArrivalsCard` to be a Client Component. The simplest correct fix is to add `"use client"` to the whole `cs.tsx` file (all its exports are pure presentational React with no server-only APIs, so the bundle impact is negligible).

**Files:**
- Modify: `app/admin/_components/cs.tsx` (add `"use client"` directive + update `ExpectedArrivalsCard` around lines 70-99)

- [ ] **Step 1: Add `"use client"` directive at the top of `cs.tsx`**

Insert as the very first line of `app/admin/_components/cs.tsx` (above the existing comment header):

```tsx
"use client";

```

(One blank line after, then the existing `// Coastal Serenity-style presentational...` comment continues unchanged.)

- [ ] **Step 2: Make `ctaHref` optional and add `ctaOnClick`**

In `app/admin/_components/cs.tsx`, replace the `ExpectedArrivalsCard` export with:

```tsx
// ---------- Dark "Expected Arrivals" card with CTA ----------
export function ExpectedArrivalsCard({
  count,
  icon,
  ctaLabel,
  ctaHref,
  ctaOnClick,
}: {
  count: number;
  icon: React.ReactNode;
  ctaLabel: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}) {
  const ctaClass =
    "flex min-h-[48px] w-full items-center justify-center rounded-xl bg-teal px-6 text-[16px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40";
  return (
    <div className="flex flex-col rounded-2xl bg-navy p-6 text-white ring-1 ring-navy">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70">
        <span aria-hidden>{icon}</span>
        Expected Arrivals
      </div>
      <p className="mt-3 text-4xl font-extrabold leading-none">{count}</p>
      <div className="mt-auto pt-6">
        {ctaOnClick ? (
          <button type="button" onClick={ctaOnClick} className={ctaClass}>
            {ctaLabel}
          </button>
        ) : (
          <Link href={ctaHref ?? "#"} className={ctaClass}>
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
```

(Existing callers passing only `ctaHref` keep working because the `<Link>` branch is unchanged. The Overview page will switch to `ctaOnClick` in Task 9.)

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/admin/_components/cs.tsx
git commit -m "feat(admin/cs): client-promote and add onClick CTA to ExpectedArrivalsCard"
```

---

### Task 4: Create `AdminQuickTools` — module shell, state, and event wiring

This task scaffolds the file. The sub-components (`SpeedDialFab`, `AiPanel`, `ScanModal`) are added in Tasks 5/6/7 so each step stays bite-sized and the file compiles after every step.

**Files:**
- Create: `app/admin/_components/AdminQuickTools.tsx`

- [ ] **Step 1: Create the file with the orchestrator + helpers + stub sub-components**

Create `app/admin/_components/AdminQuickTools.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Close, RotateCcw, ScanLine, Sparkles } from "@/components/Icons";
import { AvailabilityChat } from "./AvailabilityChat";
import { CheckInScanner } from "./CheckInScanner";

// Trigger helpers — any admin page can call these to open the FAB tools.
export const openAdminAi = () => window.dispatchEvent(new Event("admin:open-ai"));
export const openAdminScan = () => window.dispatchEvent(new Event("admin:open-scan"));

export function AdminQuickTools() {
  const [dialOpen, setDialOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // External openers (Overview KPI card etc.) dispatch window events.
  useEffect(() => {
    const onAi = () => { setDialOpen(false); setScanOpen(false); setAiOpen(true); };
    const onScan = () => { setDialOpen(false); setAiOpen(false); setScanOpen(true); };
    window.addEventListener("admin:open-ai", onAi);
    window.addEventListener("admin:open-scan", onScan);
    return () => {
      window.removeEventListener("admin:open-ai", onAi);
      window.removeEventListener("admin:open-scan", onScan);
    };
  }, []);

  // Esc closes whichever surface is most-front.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (scanOpen) setScanOpen(false);
      else if (aiOpen) setAiOpen(false);
      else if (dialOpen) setDialOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiOpen, scanOpen, dialOpen]);

  return (
    <>
      <SpeedDialFab
        open={dialOpen}
        onToggle={() => setDialOpen((v) => !v)}
        onPickAi={() => { setDialOpen(false); setAiOpen(true); }}
        onPickScan={() => { setDialOpen(false); setScanOpen(true); }}
      />
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}

// Stubs — filled in by Tasks 5/6/7.
function SpeedDialFab(_props: {
  open: boolean;
  onToggle: () => void;
  onPickAi: () => void;
  onPickScan: () => void;
}) {
  return null;
}

function AiPanel(_props: { open: boolean; onClose: () => void }) {
  return null;
}

function ScanModal(_props: { open: boolean; onClose: () => void }) {
  return null;
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0 (the unused-parameter prefix `_` and unused imports for now-stub components must not warn; if any do, leave them — Tasks 5/6/7 will consume them all).

If `pnpm lint` warns about unused imports (`Close`, `RotateCcw`, `AvailabilityChat`, `CheckInScanner`, `Sparkles`, `ScanLine`, `useRef`), that's expected at this point — proceed to Task 5 immediately (don't commit yet, or commit with `--no-verify` only if a pre-commit hook blocks unused imports). The cleanest path: combine Step 3 of this task with Step 3 of Task 5 — i.e., don't commit Task 4 alone.

- [ ] **Step 3: Do NOT commit yet — proceed to Task 5**

The file is intentionally incomplete after this task. Task 5 fills the FAB and consumes most of the unused imports. Commit after Task 5.

---

### Task 5: Build `SpeedDialFab` inside `AdminQuickTools`

**Files:**
- Modify: `app/admin/_components/AdminQuickTools.tsx`

- [ ] **Step 1: Replace the `SpeedDialFab` stub with the real component**

In `app/admin/_components/AdminQuickTools.tsx`, replace the `SpeedDialFab` function body with:

```tsx
function SpeedDialFab({
  open,
  onToggle,
  onPickAi,
  onPickScan,
}: {
  open: boolean;
  onToggle: () => void;
  onPickAi: () => void;
  onPickScan: () => void;
}) {
  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 md:bottom-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* On mobile, lift above the Topbar mobile nav strip (~56px tall when wrapped). */}
      <div className="pointer-events-none mb-16 md:mb-0">
        {/* Fan-out actions */}
        <div
          className={`pointer-events-auto flex flex-col items-end gap-2 transition-all duration-150 ${
            open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
          }`}
          aria-hidden={!open}
        >
          <button
            type="button"
            onClick={onPickScan}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-navy shadow-lg ring-1 ring-navy/10 transition hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
          >
            <ScanLine className="h-4 w-4" />
            Scan check-in
          </button>
          <button
            type="button"
            onClick={onPickAi}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-navy shadow-lg ring-1 ring-navy/10 transition hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>
        </div>

        {/* Primary toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? "Close quick tools" : "Open quick tools"}
          className={`pointer-events-auto mt-3 grid h-14 w-14 place-items-center rounded-full bg-teal text-white shadow-xl transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
            open ? "rotate-45" : ""
          }`}
        >
          {open ? <Close className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
```

(The `rotate-45` on the open state lets the icon-swap feel like motion. The wrapper is `pointer-events-none` so it doesn't block clicks on the page beneath the FAB; each interactive child re-enables `pointer-events-auto`.)

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0. (`useRef`, `Close`, `Sparkles`, `ScanLine` are now used. `AvailabilityChat`, `CheckInScanner`, `RotateCcw` still unused — that's fine, Tasks 6/7 consume them.)

- [ ] **Step 3: Do NOT commit yet — proceed to Task 6**

Same reason as Task 4: avoid committing a file with unused imports.

---

### Task 6: Build `AiPanel` (right-side slide-in, kept mounted)

**Files:**
- Modify: `app/admin/_components/AdminQuickTools.tsx`

- [ ] **Step 1: Replace the `AiPanel` stub with the real component**

In `app/admin/_components/AdminQuickTools.tsx`, replace the `AiPanel` function body with:

```tsx
function AiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Held in a ref so the panel header's "Clear" button can call into the
  // child without re-rendering the chat (which would unmount it and lose state).
  const clearRef = useRef<() => void>(() => {});

  return (
    <aside
      role="dialog"
      aria-label="Availability assistant"
      aria-hidden={!open}
      // hidden + translate-x keeps the chat mounted (so useChat history survives)
      // while keeping it off-screen and unfocusable when closed.
      className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col bg-white shadow-2xl ring-1 ring-navy/10 transition-transform duration-200 md:w-[420px] ${
        open ? "translate-x-0" : "pointer-events-none translate-x-full"
      }`}
      // Trap tab inside the panel only when open — leave focus-trap library out,
      // browsers handle inert reasonably with aria-hidden + pointer-events-none.
    >
      <header className="flex items-center justify-between gap-2 border-b border-navy/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal-deep">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="text-[15px] font-bold text-navy">Availability assistant</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => clearRef.current()}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-3">
        <AvailabilityChat onClearReady={(c) => { clearRef.current = c; }} />
      </div>
    </aside>
  );
}
```

(The `clearRef` pattern keeps `<AvailabilityChat />` from receiving prop changes that would force it to re-mount and lose chat state. The chat reports its `clear` function once via the `onClearReady` effect from Task 2; the panel header invokes it via the ref.)

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0. `AvailabilityChat`, `RotateCcw` now consumed. `CheckInScanner` still unused — Task 7 fixes it.

- [ ] **Step 3: Do NOT commit yet — proceed to Task 7**

---

### Task 7: Build `ScanModal` (full-screen, mounts only when open)

**Files:**
- Modify: `app/admin/_components/AdminQuickTools.tsx`

- [ ] **Step 1: Replace the `ScanModal` stub with the real component**

In `app/admin/_components/AdminQuickTools.tsx`, replace the `ScanModal` function body with:

```tsx
function ScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mount the scanner only while open — closing unmounts it so getUserMedia
  // tracks are released by CheckInScanner's own cleanup effect.
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Check-in scanner"
      className="fixed inset-0 z-50 flex flex-col bg-navy/40 backdrop-blur-sm md:items-center md:justify-center md:p-6"
    >
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-cream shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-2xl">
        <header className="flex items-center justify-between gap-2 border-b border-navy/10 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal-deep">
              <ScanLine className="h-5 w-5" />
            </span>
            <p className="text-[15px] font-bold text-navy">Check-in scanner</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <Close className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <CheckInScanner />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0 with zero warnings — all imports are now consumed.

- [ ] **Step 3: Commit the whole `AdminQuickTools` file (Tasks 4-7 combined)**

```bash
git add app/admin/_components/AdminQuickTools.tsx
git commit -m "feat(admin): floating speed-dial with AI panel and scan modal"
```

---

### Task 8: Mount `AdminQuickTools` in the admin app layout

**Files:**
- Modify: `app/admin/(app)/layout.tsx`

- [ ] **Step 1: Add the mount**

Replace the contents of `app/admin/(app)/layout.tsx` with:

```tsx
import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "../_components/Sidebar";
import { AdminQuickTools } from "../_components/AdminQuickTools";

// Sidebar shell for the authenticated admin area. Login stays OUTSIDE this
// route group so it renders without the sidebar.
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar email={admin.email ?? ""} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <AdminQuickTools />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Manual smoke (dev server)**

Run: `pnpm dev` (in a separate terminal if needed)
Open: `http://localhost:3000/admin`
Verify:
- Bottom-right teal FAB visible on Overview.
- Tap → speed dial opens with "Scan check-in" + "Ask AI" buttons.
- Tap "Ask AI" → right panel slides in, chat is interactive.
- Send a test message ("hello") → assistant responds (existing behavior).
- Tap the rotate (clear) icon in the panel header → conversation clears.
- Send another message → "hello again". Close the panel (X), reopen → "hello again" still there.
- Navigate to Bookings, reopen panel → still there.
- Tap "Scan check-in" → modal opens with camera. Close it (X). Open DevTools → no active camera stream remains (the indicator icon in your browser's tab/address bar should disappear).
- Press `Esc` while panel/modal is open → it closes.

Stop `pnpm dev` before continuing (or leave it running — Task 9 only edits code).

- [ ] **Step 4: Commit**

```bash
git add app/admin/(app)/layout.tsx
git commit -m "feat(admin): mount AdminQuickTools in (app) layout"
```

---

### Task 9: Re-target the Overview Check-in Center CTA

**Files:**
- Modify: `app/admin/(app)/page.tsx`

- [ ] **Step 1: Add the `openAdminScan` import and swap the CTA**

In `app/admin/(app)/page.tsx`, add this import immediately after the existing `import { DEMO_FACILITIES, ... }` line:

```tsx
import { openAdminScan } from "../_components/AdminQuickTools";
```

Then find the `<ExpectedArrivalsCard>` block (around lines 56-61):

```tsx
          <ExpectedArrivalsCard
            count={counts.arrivalsToday}
            icon={<Luggage className="h-5 w-5" />}
            ctaLabel="Check-in Center"
            ctaHref="/admin/scan"
          />
```

Replace it with:

```tsx
          <ExpectedArrivalsCard
            count={counts.arrivalsToday}
            icon={<Luggage className="h-5 w-5" />}
            ctaLabel="Check-in Center"
            ctaOnClick={openAdminScan}
          />
```

**Why this works:** `app/admin/(app)/page.tsx` is a Server Component. `openAdminScan` is a function reference imported from `AdminQuickTools.tsx` (a Client Component file). Passing the function as a prop to `<ExpectedArrivalsCard />` (which became a Client Component in Task 3 Step 1) crosses the boundary cleanly — Next.js supports passing client-imported function references as props from server to client.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Manual smoke**

Restart `pnpm dev` if needed.
Open: `http://localhost:3000/admin`
- Tap the "Check-in Center" button on the Expected Arrivals KPI.
- Expected: scanner modal opens (NOT navigation to `/admin/scan`).
- URL should stay `/admin`.

- [ ] **Step 4: Commit**

```bash
git add app/admin/(app)/page.tsx
git commit -m "feat(admin): Check-in Center KPI opens scanner modal"
```

---

### Task 10: Remove the AI and Scan entries from the admin nav

**Files:**
- Modify: `app/admin/_components/nav.ts`

- [ ] **Step 1: Drop the two entries**

In `app/admin/_components/nav.ts`, replace the `ADMIN_NAV` array with:

```ts
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", norm: "/", label: "Overview", Icon: LayoutGrid },
  { href: "/admin/bookings", norm: "/bookings", label: "Bookings", Icon: ClipboardList },
  { href: "/admin/calendar", norm: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/admin/resort-config", norm: "/resort-config", label: "Resort Config", Icon: Settings },
  { href: "/admin/account", norm: "/account", label: "Account", Icon: Users },
];
```

Also remove `ScanLine` and `Sparkles` from the icons import (now unused in this file):

```ts
import { Calendar, ClipboardList, LayoutGrid, Settings, Users } from "@/components/Icons";
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Manual smoke**

In `pnpm dev`, refresh `http://localhost:3000/admin`:
- Sidebar shows exactly 5 items: Overview, Bookings, Calendar, Resort Config, Account.
- Mobile viewport (DevTools → toggle device toolbar): mobile nav strip in Topbar also shows 5 items, no clipping.

- [ ] **Step 4: Commit**

```bash
git add app/admin/_components/nav.ts
git commit -m "refactor(admin/nav): remove AI and Scan tabs (moved to FAB)"
```

---

### Task 11: Delete the obsolete `/admin/ai` and `/admin/scan` routes

**Files:**
- Delete: `app/admin/(app)/ai/` (recursive)
- Delete: `app/admin/(app)/scan/` (recursive)

- [ ] **Step 1: Confirm no other code references the routes**

Run a grep across the repo to be sure nothing else links there:

```bash
git grep -n "/admin/ai\|/admin/scan" -- ':!docs/' ':!*.md'
```

Expected output: empty (no matches outside docs/markdown). If anything matches, fix that file BEFORE deleting the routes.

- [ ] **Step 2: Delete the route folders**

PowerShell:
```
Remove-Item -Recurse -Force "app/admin/(app)/ai"
Remove-Item -Recurse -Force "app/admin/(app)/scan"
```

Or via `git rm` (preserves history cleanly):
```bash
git rm -r "app/admin/(app)/ai" "app/admin/(app)/scan"
```

- [ ] **Step 3: Type-check, lint, and verify 404**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0.

In `pnpm dev`, navigate to `http://localhost:3000/admin/ai` and `http://localhost:3000/admin/scan`:
- Expected: Next.js 404 (the admin layout still wraps the 404, that's fine).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(admin): remove obsolete /ai and /scan routes (replaced by FAB)"
```

---

### Task 12: Final verification pass

- [ ] **Step 1: Full type + lint sweep**

Stop `pnpm dev` (so `.next/` is free).

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `pnpm lint`
Expected: exit 0 with zero warnings.

- [ ] **Step 2: Production-style smoke (optional but recommended)**

With dev server stopped:

```bash
pnpm build
```

Expected: build succeeds.

Then:

```bash
pnpm start
```

Open `http://localhost:3000/admin` and re-run the full Task 8/9 manual flow:
- FAB visible on every admin page (Overview, Bookings, Calendar, Resort Config, Account).
- Speed dial opens both panel and modal.
- AI chat persists across page navigation; clear button works.
- Scanner camera releases on modal close.
- Overview "Check-in Center" opens scanner modal.
- `/admin/ai` and `/admin/scan` return 404.
- Sidebar = 5 items.
- Mobile viewport works (FAB above the mobile nav strip, no clipping, safe-area-inset respected on iOS Safari simulator if accessible).

Stop the production server.

- [ ] **Step 3: No commit needed**

Task 12 is verification only. If the smoke pass finds an issue, file it as a follow-up task and fix in a new commit; do NOT amend prior commits.

---

## Self-Review Notes

- **Spec coverage:** Every spec section is mapped to a task: Architecture → Tasks 4–8; SpeedDialFab → 5; AiPanel → 6 (with clear-chat via Task 2's `onClearReady`); ScanModal → 7; cross-component contract → 4 + 9; nav removal → 10; route deletion → 11; manual verification flow → 8, 9, 12.
- **Bite-sized:** Each step is one action (edit a file / run a command / commit).
- **TDD note:** No test runner in repo (per `CLAUDE.md`), so verification is type-check + lint + manual smoke per task. This matches the project's current discipline.
- **`useRef` import** is consumed in Task 6 (`clearRef`). The import sits unused after Task 4, which is why Tasks 4/5/6/7 deliberately commit together at the end of Task 7.
- **Server/Client boundary** is the trickiest part — Task 9 Step 2 spells it out: function reference passed as prop into a Client Component, which is supported by Next.js.
