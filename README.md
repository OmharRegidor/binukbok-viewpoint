# Binukbok View Point Resort — Clone

A faithful front-end clone of the Binukbok View Point Resort website, built with
**Next.js (App Router) + Tailwind CSS v4**.

> Visual reproduction only. Images are intentionally rendered as gray placeholders,
> and the booking form is UI-only (validates and shows a confirmation, but does not
> submit to any backend).

## Pages

| Route | Page |
|-------|------|
| `/` | Home — hero, scuba feature, accommodations preview, testimonials, CTA |
| `/accommodations` | Room listings (Couple, Family, Kubo, Camping) + amenities |
| `/diving` | BIDA dive academy — why choose us + diving packages |
| `/book` | Book Your Stay — reservation form + live booking summary |

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Build

```bash
pnpm build
pnpm start
```

## Customising

- **Content** (rooms, packages, testimonials, contact) lives in `lib/data.ts`.
- **Colors / theme tokens** are defined in `app/globals.css` under `@theme`.
- **Replace placeholders with real photos:** swap the `.placeholder` `<div>`s for
  `next/image` components. Drop assets in `public/` and reference them.

## Tech

- Next.js 15 (App Router, React 19)
- Tailwind CSS v4
- TypeScript
- No external UI/icon libraries — icons are inline SVG (`components/Icons.tsx`)
