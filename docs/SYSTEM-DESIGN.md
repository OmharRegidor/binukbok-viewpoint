# System Design — BiNuKBoK VieW PoiNT ReSoRT backend

> Drafted by Bryl (Noxa's Dev Team) for owner validation.
> Status: **PROPOSAL v2 — incorporates owner answers (QR check-in, diving add-ons, deposit + hold). Validate each diagram before code.**
> Stack (locked in CLAUDE.md): Next.js 15 (App Router) · Supabase PostgreSQL · Prisma · Vercel · Clerk (admin auth) · OpenAI `gpt-4o-mini` via Vercel AI SDK.

---

## 0. What changed in v2 (from your answers)

| Topic | Your decision | Design impact |
|-------|---------------|---------------|
| Room units | Asked why it matters → **model units regardless, seed real counts** | `room_units` stays; counts are seed data |
| Acceptance | **QR code that the admin scans** to accept/check in | `confirmation_code` + QR; new "check-in" state + scan flow (Diagram 7) |
| Diving | **Bookable as an add-on inside the booking form** (checkbox + dropdown of all courses; pre-selected from a dive page) | `booking_dive_addons` join table; `/book?dive=<slug>` deep link |
| Payments | **Deposit + hold policy** | `payments` table + `hold_expires_at`; deposit-to-confirm state machine (Diagram 4) |

---

## 1. Design decisions (research-backed)

| # | Decision | Why (and what we rejected) |
|---|----------|----------------------------|
| D1 | **Reserve a physical unit + Postgres `EXCLUDE` constraint** | Big-hotel designs use a per-date *inventory counter* with locking — overkill and error-prone at your scale. A per-unit exclusion constraint makes double-booking *structurally impossible* in the DB with zero locking code. |
| D2 | **`room_types` (catalog/pricing) ≠ `room_units` (physical bookable things)** | The unit count = max bookings you can accept for the same dates. Model units even if it's 1 of each today; seed the real counts to avoid a painful migration later. |
| D3 | **Half-open date ranges `[)`** | Checkout on the 12th + check-in on the 12th must **not** collide. |
| D4 | **Partial constraint: `WHERE status NOT IN ('cancelled','expired')`** | Cancelled/expired holds free the dates back automatically without deleting history. |
| D5 | **Deposit-to-confirm state machine with hold expiry** (Diagram 4) | Dates are held the instant a booking is created; an unpaid hold auto-expires and releases. Confirmation requires a verified GCash deposit. |
| D6 | **QR confirmation code for check-in** | On confirmation, issue a high-entropy **opaque** `confirmation_code` rendered as a QR. Admin scans it on arrival to check the guest in. Never encode a raw/guessable booking id. |
| D7 | **Diving is an add-on to a stay** | A booking can include one or more dive experiences via `booking_dive_addons`. Standalone dive-only booking (no room) is a future option — flagged in §8. |
| D8 | **`booking_events` audit table** | Every status change (who/when) for the admin trail. |
| D9 | **`EXCLUDE` constraint as raw-SQL Prisma migration** | Prisma can't express exclusion constraints natively (issue #17514). Raw SQL; run migrations on the **direct** connection (`directUrl`, port 5432), not the pooler. |
| D10 | **Server recomputes price + availability; all dates `Asia/Manila`** | Client never trusted. The Server Action recomputes nights, room + dive totals, and re-checks availability inside the transaction. |

**Payment rollout:** v1 = **manual GCash** (guest sends reference + screenshot, admin verifies). v2 = **PayMongo or Xendit** (both support GCash in the Philippines) for instant auto-confirm via webhook. The data model below supports both — only the verification step changes.

### Locked parameters (v2)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Deposit | **₱500 fixed** | Same flat reservation fee for every booking |
| Deposit window (hold) | **24h after booking, capped by check-in** | `hold_expires_at = LEAST(created_at + 24h, check_in − buffer)` so same-/next-day bookings don't expire *after* arrival |
| Advance booking horizon | **up to 12 months ahead** | The 24h deposit rule still applies regardless of how far out the stay is |
| Diving | **add-on to a room stay only** | No dive-only bookings in v1 |
| Notifications | **Email only (Resend)** | Confirmation + QR sent by email |
| Payment (v1) | **Manual GCash** | Guest sends ref # + screenshot; admin verifies |

**Deliberately NOT building now:** no inventory microservice, no Redis counters, no separate booking/inventory services, no payment gateway in v1, no SMS provider.

---

## 2. System context (architecture)

```mermaid
flowchart TD
    subgraph Client["Browser"]
        Guest["Guest<br/>(site + booking form + diving add-on)"]
        Admin["Owner / Admin<br/>(dashboard + QR scanner + AI assistant)"]
    end

    subgraph Vercel["Next.js 15 on Vercel"]
        RSC["Server Components<br/>(read room + dive catalog)"]
        SA["Server Actions<br/>(submit / confirm / cancel / check-in)"]
        RH["Route Handlers<br/>/api/admin/*  /api/scan  /api/chat"]
        Tools["Read-only Prisma tools<br/>getAvailability()"]
    end

    subgraph External["Managed services"]
        DB[("Supabase PostgreSQL<br/>EXCLUDE constraint = source of truth")]
        Clerk["Clerk<br/>admin auth"]
        OpenAI["OpenAI gpt-4o-mini"]
        Pay["GCash (manual v1)<br/>PayMongo/Xendit (v2)"]
    end

    Guest --> RSC
    Guest --> SA
    Guest -. "deposit" .-> Pay
    Admin --> RH
    Admin -. "Clerk session" .-> Clerk
    RH -. "verify admin role" .-> Clerk
    RSC --> DB
    SA --> DB
    RH --> DB
    RH --> Tools
    Tools --> DB
    RH --> OpenAI
    OpenAI -. "tool call: getAvailability" .-> Tools
    Pay -. "webhook (v2)" .-> RH

    style DB fill:#1e3a5f,color:#fff
    style OpenAI fill:#10707a,color:#fff
    style Clerk fill:#6b4ea0,color:#fff
    style Pay fill:#0a7d3c,color:#fff
```

---

## 3. ERD — data model

```mermaid
erDiagram
    ROOM_TYPES ||--o{ ROOM_UNITS : "has physical"
    ROOM_TYPES ||--o{ RATE_OVERRIDES : "priced by (future)"
    ROOM_UNITS ||--o{ BOOKINGS : "reserved in"
    GUESTS ||--o{ BOOKINGS : "places"
    BOOKINGS ||--o{ BOOKING_EVENTS : "audited by"
    BOOKINGS ||--o{ BOOKING_DIVE_ADDONS : "includes"
    DIVE_PACKAGES ||--o{ BOOKING_DIVE_ADDONS : "chosen as"
    BOOKINGS ||--o{ PAYMENTS : "paid via"

    ROOM_TYPES {
        uuid id PK
        string slug UK "couple-room, family-room..."
        string name
        string tagline
        string badge
        text description
        int base_price_per_night "PHP"
        int max_guests "parsed from 'Up to N guests'"
        jsonb features "string[] for now"
    }

    ROOM_UNITS {
        uuid id PK
        uuid room_type_id FK
        string label "e.g. Couple Room A"
        string status "active | maintenance"
    }

    GUESTS {
        uuid id PK
        string full_name
        string email
        string phone
    }

    BOOKINGS {
        uuid id PK
        uuid room_unit_id FK
        uuid guest_id FK
        date check_in
        date check_out "half-open [check_in, check_out)"
        int nights "server-computed"
        int room_subtotal "server-recomputed"
        int dive_subtotal "sum of add-ons"
        int total_price "room + dive"
        int deposit_amount "required to confirm"
        string status "see state machine"
        string confirmation_code UK "short, human-readable; QR payload"
        string view_token UK "high-entropy; public /b/[token] link only"
        text special_requests "untrusted; max 500; delimited before LLM"
        timestamptz hold_expires_at "auto-expire if unpaid"
        timestamptz checked_in_at
        timestamptz created_at
        timestamptz updated_at
    }

    BOOKING_DIVE_ADDONS {
        uuid id PK
        uuid booking_id FK
        uuid dive_package_id FK
        int participants
        date preferred_date "nullable; coordinate on arrival"
        int price_at_booking "snapshot"
    }

    DIVE_PACKAGES {
        uuid id PK
        string slug UK "discovery-dive, open-water..."
        string name
        string tagline
        int price
        string unit "Half Day, Per Dive..."
        boolean popular
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        string kind "deposit | balance"
        string method "gcash | cash"
        int amount
        string reference_no "GCash ref #"
        string proof_url "screenshot (v1)"
        string status "submitted | verified | rejected"
        string verified_by "clerk_user_id"
        timestamptz created_at
        timestamptz verified_at
    }

    BOOKING_EVENTS {
        uuid id PK
        uuid booking_id FK
        string from_status
        string to_status
        string actor "guest | admin:clerk_id | system"
        text note
        timestamptz created_at
    }

    RATE_OVERRIDES {
        uuid id PK
        uuid room_type_id FK
        daterange period "seasonal/weekend (future)"
        int price_per_night
    }
```

**The constraint that makes it all work** (raw-SQL migration):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    room_unit_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'expired'));
```

---

## 4. Booking lifecycle (state machine, with deposit + hold + QR)

```mermaid
stateDiagram-v2
    [*] --> pending_payment: guest submits<br/>(dates held by EXCLUDE)
    pending_payment --> payment_review: guest sends GCash proof
    pending_payment --> expired: hold_expires_at passes (system)
    pending_payment --> cancelled: guest/owner cancels
    payment_review --> confirmed: admin verifies deposit<br/>→ issue QR code
    payment_review --> pending_payment: admin rejects proof
    confirmed --> checked_in: admin scans QR on arrival
    confirmed --> cancelled: owner cancels
    checked_in --> completed: after check_out (balance settled)
    cancelled --> [*]
    expired --> [*]
    completed --> [*]

    note right of pending_payment
        Dates HELD the instant the booking exists.
        hold_expires_at = LEAST(created_at + 24h,
        check_in − buffer) → same/next-day bookings
        shrink the window instead of expiring late.
        v2 (PayMongo/Xendit): pending_payment →
        confirmed via webhook, skipping payment_review.
    end note
```

---

## 5. Guest booking submission — with diving add-ons (sequence)

```mermaid
sequenceDiagram
    actor G as Guest
    participant F as BookingForm (client)
    participant A as Server Action
    participant Z as Zod (server schema)
    participant DB as Supabase Postgres

    Note over G,F: arrived via /book?dive=open-water → dive pre-selected
    G->>F: dates, room, guests, "Add Diving Experience" + course(s)
    F->>F: client validation + live total (UX only)
    F->>A: submit(BookingInput + diveAddons[])
    A->>Z: validate (authoritative); special_requests max 500
    alt invalid
        Z-->>A: error
        A-->>F: { ok:false, errors }
    else valid
        A->>A: recompute nights, room subtotal,<br/>dive subtotal, deposit (Asia/Manila)
        A->>DB: BEGIN TX → upsert guest →<br/>INSERT booking (status=pending_payment,<br/>hold_expires_at, confirmation_code) →<br/>INSERT dive add-ons → INSERT booking_event
        alt dates overlap
            DB-->>A: 23P01 exclusion_violation
            A-->>F: { ok:false, message:"Those dates are taken" }
        else free
            DB-->>A: COMMIT (booking id + GCash instructions)
            A-->>F: { ok:true, bookingId, depositAmount, payTo }
            F->>G: "Reserved! Pay ₱X deposit via GCash to confirm."
        end
    end
```

---

## 6. Admin confirm (verify deposit) — sequence

```mermaid
sequenceDiagram
    actor O as Owner/Admin
    participant UI as Admin dashboard
    participant RH as /api/admin/payments
    participant CL as Clerk
    participant DB as Supabase Postgres
    participant N as Email/SMS

    O->>UI: open booking in "payment_review"
    UI->>RH: POST { bookingId, action:"verify" }
    RH->>CL: verify admin role (on handler)
    alt not admin
        CL-->>RH: unauthorized
        RH-->>UI: 403
    else admin
        RH->>DB: TX → payment.status=verified →<br/>booking.status=confirmed → booking_event
        DB-->>RH: COMMIT
        RH->>N: send confirmation + QR (confirmation_code)
        RH-->>UI: 200 confirmed
        UI->>O: booking now "confirmed", QR issued
    end
```

---

## 7. QR check-in on arrival — sequence

```mermaid
sequenceDiagram
    actor O as Owner/Admin
    actor G as Guest
    participant Cam as Scanner page (camera)
    participant RH as /api/scan
    participant CL as Clerk
    participant DB as Supabase Postgres

    G->>O: shows QR (confirmation_code) on phone
    O->>Cam: open scanner in dashboard
    Cam->>Cam: read QR → confirmation_code
    Cam->>RH: POST { confirmation_code }
    RH->>CL: verify admin role + rate limit
    RH->>DB: SELECT booking by confirmation_code
    alt invalid / not confirmed / already checked in
        DB-->>RH: no match or wrong state
        RH-->>Cam: ⚠ show reason
    else valid & confirmed
        RH->>DB: TX → status=checked_in,<br/>checked_in_at=now() → booking_event
        DB-->>RH: COMMIT
        RH-->>Cam: ✅ guest details + balance due
        Cam->>O: "Checked in: Couple Room A"
    end
```

---

## 8. AI chatbot — read-only availability assistant (sequence)

```mermaid
sequenceDiagram
    actor O as Owner/Admin
    participant UI as Chat UI (useChat)
    participant RH as /api/chat (stream)
    participant CL as Clerk
    participant LLM as gpt-4o-mini (AI SDK)
    participant T as getAvailability() tool
    participant DB as Supabase Postgres

    O->>UI: "Is the Kubo free next weekend?"
    UI->>RH: POST messages
    RH->>CL: verify admin role
    RH->>RH: wrap untrusted text in [GUEST_INPUT]..[/GUEST_INPUT]
    RH->>LLM: prompt + READ-ONLY tool schema
    LLM-->>RH: tool_call getAvailability(checkIn,checkOut,type?)
    RH->>T: execute (allowlisted, read-only)
    T->>DB: units NOT in overlapping non-cancelled bookings
    DB-->>T: free units (no PII)
    T-->>LLM: availability
    LLM-->>RH: streamed answer
    RH-->>UI: stream tokens
    UI->>O: "Kubo Room A is free Sat–Sun."
```

---

## 9. Decisions log

**Locked:** deposit ₱500 fixed · hold 24h (capped by check-in) · advance booking ≤12 months · diving = add-on only · email-only (Resend) · manual GCash (v1).

**Still needed before seeding the DB:**

1. **Unit counts** — how many physical units of each: Couple / Family / Kubo / Camping Tent? (default: 1 each, change anytime via seed)
2. **GCash receiver** — the GCash name + number guests pay the ₱500 deposit to (shown on the confirmation screen + email).
3. **Diving details** — confirm we capture *participants + preferred date* per dive add-on. (assumed yes)

---

## 10. Data access architecture (Prisma + Supabase)

```mermaid
flowchart TD
    subgraph browser["Browser (client)"]
      UI["Pages / BookingForm"]
    end
    subgraph next["Next.js on Vercel — SERVER ONLY"]
      SC["Server Components (read)"]
      SA["Server Actions (createBooking, confirm)"]
      RH["Route Handlers (/api/chat, /api/admin)"]
      REPO["lib/db/*.ts — repository fns<br/>getRooms() · getAvailability() · createBooking()"]
      PC["Prisma Client (lib/prisma.ts singleton)"]
    end
    subgraph supa["Supabase"]
      POOL[("Supavisor pooler :6543")]
      PG[("PostgreSQL + EXCLUDE constraint")]
    end
    SCHEMA["schema.prisma"] -->|"prisma migrate · DIRECT_URL :5432"| PG
    UI --> SC
    UI --> SA
    UI --> RH
    SC --> REPO
    SA --> REPO
    RH --> REPO
    REPO --> PC
    PC -->|"DATABASE_URL · pooled :6543"| POOL
    POOL --> PG
    style PG fill:#1e3a5f,color:#fff
```

**Pattern:** layered architecture with a Repository seam. Supabase = the managed Postgres database; Prisma = the only thing that talks to it, server-side. Components/actions call `lib/db/*` functions (the seam that replaces today's hardcoded `lib/data.ts`), which call the Prisma client singleton.

**Connection wiring (two strings):** `DATABASE_URL` = pooled (Supavisor :6543) for runtime; `DIRECT_URL` = direct (:5432) for `prisma migrate` only. **Prisma bypasses RLS** (privileged role) — authorization lives in server code (Clerk + Server Actions); keep RLS enabled as a defense-in-depth backstop.

---

## 11. Implementation status

✅ **Live & verified against Supabase (`binukbok-viewpoint`, ap-southeast-1):**
- `prisma/schema.prisma` — all 8 tables/enums from the ERD, snake_case columns (`@map`). Prisma **6.x** (v7 deferred — needs `prisma.config.ts` + driver adapters, off the documented Supabase path)
- Migrations applied: `…_init` (tables) + `…_security_setup` (RLS on all 8 tables + the `EXCLUDE` constraint)
- **Double-booking constraint behaviorally verified** (`scripts/verify-db.ts`): overlap rejected, adjacent (half-open) allowed ✅
- Seeded: 4 room types, **4 room units (1 each — placeholder counts)**, 4 dive packages
- `lib/prisma.ts` (client singleton) · `lib/schemas.ts` (Zod contracts) · `prisma/seed.ts`
- `@prisma/client` `prisma` `zod` `tsx` installed; `prisma generate` + `tsc --noEmit` pass
- Hygiene: stray `package-lock.json` removed and gitignored; `db:*` scripts in `package.json`
- **Post-booking page live & verified** (`app/b/[token]`): `view_token` migration applied, QR + Add-to-Calendar, security headers, invalid-token safe — confirmed via live fetch (see §12)
- **`createBooking` + `getAvailability` live & verified** (`lib/db/bookings.ts`, `app/book/actions.ts`): book-by-**type** with automatic unit assignment, server-side pricing + validation (past-date, capacity, dive packages), `EXCLUDE`-guarded races, returns the `/b/[token]` link — 7/7 checks (`scripts/test-create-booking.ts`)
- **Booking form wired end-to-end & browser-verified**: `/book` reads the catalog from the DB (`lib/db/catalog.ts`), supports `?dive=<slug>` pre-select and the "Add Diving Experience" UI → `createBookingAction` → redirects to `/b/[token]`. Pending bookings show a gray GCash-deposit placeholder; the QR appears after `CONFIRMED`. Verified by a real form submission in the browser.

⏭️ **Next:**
1. Admin dashboard (Clerk): deposit verification → `CONFIRMED`; "today's arrivals" list → tap/scan → `CHECKED_IN`
2. Real GCash receiver details + confirmed unit counts (currently a gray placeholder / 1 each)
3. Hardening: rate-limit `/b/*` + scan endpoint; QR in the confirmation email (Resend); auto-expire unpaid holds (cron)
4. Phase 3 (AI chatbot)

---

## 12. Post-booking page + QR (implemented)

A new booking gets a `confirmation_code` (short, human-readable — the QR payload) and a `view_token` (high-entropy — the public link). The guest is sent to `/b/[view_token]`, which shows their booking + QR + an "Add to Google Calendar" button. On arrival they show the QR and the admin scans it to flip the booking to `CHECKED_IN` ("arrived").

```mermaid
flowchart LR
    BF["BookingForm"] -->|createBooking| SA["Server Action"]
    SA -->|generates code + view_token| DB[("bookings")]
    SA -->|redirect| V["/b/[view_token]<br/>details + QR + Add-to-Calendar"]
    V -->|guest taps| GC["Google Calendar (prefilled)"]
    V -->|shows QR on arrival| ADM["Admin scans → CHECKED_IN"]
```

**Schema delta:** one new column — `bookings.view_token` (UNIQUE, nullable). No new tables.

**Security (implemented):** `view_token` is a separate 32-byte secret (≠ `confirmation_code`); the public page shows only name / room / dates / code / QR (never email, phone, price, or special_requests); `Cache-Control: no-store` + `X-Robots-Tag: noindex` + `Referrer-Policy: no-referrer` on `/b/*`; the link is invalid after checkout + 24h and on cancellation.

**Still to harden:** rate-limit `/b/*` (scraping) and the admin scan endpoint; also deliver the QR in the confirmation email (not only via the calendar link).

---

## 13. Booking flow (end-to-end, validated)

The complete guest → arrival → checkout flow. Validated as best practice for a deposit-based resort. Manual GCash verification (steps 2–3) is the deliberate **v1** simplification — a PayMongo/Xendit webhook can auto-confirm later **without changing the flow**.

```mermaid
flowchart TD
    A["Guest books: dates, room TYPE, dives"] --> B["createBooking: server picks a free UNIT of that type<br/>booking = PENDING_PAYMENT, dates held"]
    B --> C["Guest gets booking page + ₱500 GCash deposit instructions"]
    C --> D["Guest pays, sends proof → PAYMENT_REVIEW"]
    D --> E["Owner verifies deposit → CONFIRMED, QR pass issued"]
    E --> F["Guest arrives → owner taps name / scans QR → CHECKED_IN, balance paid"]
    F --> G["After checkout date → COMPLETED"]
    C -. "unpaid hold lapses" .-> X["EXPIRED (dates freed)"]
```

**Unit assignment:** the guest books a room *type*; the server assigns an available physical *unit* of that type for the dates (the `EXCLUDE` constraint guards against races). "Fully booked" = no free unit of that type.

**Check-in is owner-controlled** (privileged action + the balance is collected then): the admin marks "arrived" by **tapping** the guest in a searchable "today's arrivals" list, or **scanning** their QR as a shortcut. Guests never mutate their own status. Idempotent; only `CONFIRMED` bookings can be marked arrived. *(A camera scanner is a later enhancement — the tap-the-list path covers 100% of check-ins.)*

**Open edge cases (decide later):** same-day walk-ins (owner creates a booking on the spot) and no-shows (auto-flag vs. leave to owner).
