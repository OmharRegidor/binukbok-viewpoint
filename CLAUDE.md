# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Next.js front-end for the **BiNuKBoK VieW PoiNT ReSoRT** website (a beach/dive resort in Bauan, Batangas). Currently a visual/marketing site only — there is **no backend, database, or API yet**. All content is static and the booking form is UI-only. An admin booking dashboard and an AI chatbot (room-availability assistant) are planned but not yet present.

## Commands

```bash
pnpm install        # install deps (pnpm is the project package manager)
pnpm dev            # dev server at http://localhost:3000
pnpm build          # production build
pnpm start          # serve the production build
pnpm lint           # next lint
npx tsc --noEmit    # type-check only (does NOT write .next/ — safe while dev runs)
```

There is no test runner configured.

### Gotchas
- **Never run `pnpm build` / `next build` while `pnpm dev` is running.** They share the `.next/` directory; the dev server then crashes with `Error: Cannot find module './<n>.js'`. Recovery: stop all dev servers, delete `.next/`, restart `pnpm dev`. To verify types without this risk, use `npx tsc --noEmit`.
- **Lockfiles:** `pnpm-lock.yaml` is the tracked lockfile — use pnpm. A stray `package-lock.json` appears if npm is used; don't commit it (a second lockfile can make deploys pick the wrong package manager).

## Architecture

- **Next.js 15 App Router + React 19 + TypeScript (strict).** Routes live in `app/`: `/` (`page.tsx`), `/accommodations`, `/diving`, `/book`. `app/layout.tsx` wraps every page with the shared `<Header />` and `<Footer />`.
- **Tailwind CSS v4, configured CSS-first — there is no `tailwind.config.js`.** All theme tokens and custom classes live in `app/globals.css`:
  - Brand color tokens under `@theme` (`--color-navy`, `--color-teal`, `--color-teal-bright`, `--color-coral`, `--color-cream`, …) → usable as `bg-navy`, `text-teal`, etc.
  - Custom classes: `.hero-poster` (hero backdrop), `.hero-wave` (animated wave sizing), `.placeholder` (gray image boxes), `.text-gradient-teal`.
- **Content is hardcoded in `lib/data.ts`** (`rooms`, `divePackages`, `testimonials`, `stats`, `contact`). Pages import from here. When a real backend is added, this is the seam to replace.
- **No external UI or icon libraries.** Icons are inline SVG components in `components/Icons.tsx`. The brand logo is `components/Logo.tsx` (renders `public/images/binukbok-logo.png` via `next/image`).
- **`components/BookingForm.tsx`** (`/book`) is fully client-side: it computes nights/totals and shows a confirmation screen — it does **not** persist or submit anywhere. This is the natural integration point for the future booking backend.
- **Path alias:** `@/*` maps to the repo root (e.g. `@/lib/data`, `@/components/Header`).

### Header & hero behavior (non-obvious)
- `components/Header.tsx` is a **`fixed` overlay** (takes no layout space). It is transparent with white text at the top of a page and switches to a solid white bar with dark text once `window.scrollY > 24` (or when the mobile menu is open). This works site-wide because **every page's first section is a dark hero**.
- The home hero is `min-h-screen` and its background is `public/images/hero-bg.png` — a pre-cropped central band of the source poster `public/images/background-image-home.png`. The crop (done with `sharp`) removes the poster's baked-in marketing title/caption so a plain `background-size: cover; background-position: center` works at every screen size. If you regenerate it, re-crop from the source poster the same way rather than fighting it with CSS background-position tricks.
- The wave at the bottom of the hero is a **single translucent SVG path animated via SMIL `<animate>` on its `d`** (not CSS). SMIL keeps it moving even when the OS has `prefers-reduced-motion` enabled.

## Conventions

- **Brand name casing:** the resort name is intentionally rendered **`BiNuKBoK VieW PoiNT ReSoRT`** — every consonant uppercase, every vowel lowercase. Apply this casing to visible brand titles/wordmarks/labels and page `<title>`s. Leave it in normal casing for the social handle (`@binukbokviewpoint`), file paths, image `alt` text, and prose/review content.
- Photos that have no real asset yet use the gray `.placeholder` boxes; real images go in `public/images/` and are referenced via `next/image`.

## Planned backend — locked decisions (NOT built yet)

> The **frontend is being finished first.** Nothing below exists in the repo yet; this is the agreed architecture for when backend work begins. Follow these choices unless the owner changes them.

**Stack**
- **Backend: Next.js-native.** Route Handlers (`app/api/.../route.ts`) for the chatbot stream + admin CRUD; Server Actions for form mutations (booking submit, confirm/cancel). No separate Express/NestJS.
- **Database: PostgreSQL on Supabase** — use the **pooled** connection string for serverless.
- **ORM: Prisma.**
- **Hosting: Vercel** (auto-deploy from GitHub).
- **Admin auth: Clerk** (Auth.js as the no-vendor fallback). Admin lives under a route group `app/(admin)/` with an auth-gated layout, isolated from the public site.
- **AI chatbot (admin-only room-availability assistant): OpenAI `gpt-4o-mini` via the Vercel AI SDK (`ai` + `@ai-sdk/openai`).** Deliberately **not** axios, and **not** LangChain/LlamaIndex (overkill for tool-calling over a SQL DB).
  - Runs **server-side only**; `OPENAI_API_KEY` stays in env, never `NEXT_PUBLIC_`, never in the client bundle.
  - Answers strictly from **read-only tool functions** over Prisma (e.g. `getAvailability(checkIn, checkOut, roomType?)`). The model never writes SQL and has no mutation tools. Delimit untrusted guest text (e.g. special requests) before it enters the prompt.
  - Client uses the AI SDK `useChat` hook against a streaming Route Handler.

**Data model essentials**
- Room **types ≠ units** — availability needs physical `room_units`, not just the types in `lib/data.ts`.
- Prevent double-booking with a Postgres **date-range exclusion constraint + transaction** (DB is the source of truth). Re-validate price/availability **server-side**. Do all date logic in **Asia/Manila**.
- `lib/data.ts` is the seam: turn its exports into DB-backed async fetchers.

**Build order**
1. **Phase 0 — hygiene:** remove stray `package-lock.json`, set up Supabase + Prisma, deploy skeleton.
2. **Phase 1 — persist bookings:** schema + availability + double-booking constraint; wire `BookingForm` to a Server Action.
3. **Phase 2 — admin dashboard:** Clerk auth, bookings list + confirm/cancel, availability calendar (this already answers "how many rooms are free?" without AI).
4. **Phase 3 — AI chatbot** (the read-only tool layer above).
5. Add **`vitest`**; first tests = nights calc, date-range overlap, pricing.

**Pre-launch frontend fixups (independent of backend)**
- Dead `href="#"` "Visit Facebook" CTA on the home page — wire or remove.
- The booking form silently collects nothing — gate it / show "coming soon" until Phase 1.
- Replace the remaining `.placeholder` photos (scuba card, final CTA block).
