# Prisma — database layer

Data model for the booking system. See `docs/SYSTEM-DESIGN.md` for the validated
ERD and flows this schema implements.

## First-time setup

1. Create a Supabase project. Copy both connection strings into `.env`:
   - `DATABASE_URL` — **pooled** (Supavisor, port `6543`, `?pgbouncer=true`) — runtime.
   - `DIRECT_URL` — **direct** (port `5432`) — migrations only.
2. Generate the client and create the base tables:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev --name init
   ```
3. Add security + the no-double-booking constraint (raw SQL — Prisma can't express these):
   ```bash
   pnpm prisma migrate dev --create-only --name security_setup
   # into the generated migration.sql, paste (in this order):
   #   1. prisma/migrations/manual_enable_rls.sql           (RLS on every table)
   #   2. prisma/migrations/manual_exclusion_constraint.sql (no double-booking)
   pnpm prisma migrate dev
   ```
4. Seed catalog + units (rooms, dive packages, physical units):
   ```bash
   pnpm prisma db seed   # once prisma/seed.ts exists
   ```

## Day-to-day

| Command | What it does |
|---------|--------------|
| `pnpm prisma generate` | Regenerate the typed client after editing the schema |
| `pnpm prisma migrate dev` | Create + apply a migration in development |
| `pnpm prisma studio` | Browse/edit data in a local GUI |
| `pnpm prisma migrate deploy` | Apply migrations in CI/production (never `dev`) |

## Gotchas

- **Migrations use `DIRECT_URL`, not the pooler** — pgbouncer transaction mode can't run Prisma's DDL.
- **The EXCLUDE constraint is hand-written SQL** (see `migrations/manual_exclusion_constraint.sql`).
- **Prisma bypasses Supabase RLS** (it connects with a privileged role). All access goes through
  trusted server code (Server Actions / Route Handlers + Clerk). Keep RLS enabled as a backstop.
