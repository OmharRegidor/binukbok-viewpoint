-- =============================================================================
-- Enable Row-Level Security on every table  (raw SQL — Prisma doesn't do this)
-- =============================================================================
-- Supabase auto-exposes a public REST API reachable with the public `anon` key.
-- A table with RLS OFF is readable/writable by anyone on the internet with that
-- key. Prisma `CREATE TABLE` does NOT enable RLS, so we must do it explicitly.
--
-- We ENABLE (not FORCE) RLS and write NO policies:
--   * `anon` / `authenticated` roles (the public PostgREST API) → DENY ALL.
--   * Prisma connects with the privileged `postgres` role → bypasses RLS → app
--     keeps working. Authorization is enforced in server code (Server Actions +
--     Clerk), with RLS as a defense-in-depth backstop.
--
-- HOW TO APPLY (in the same follow-up migration as the EXCLUDE constraint):
--   1. pnpm prisma migrate dev --create-only --name security_setup
--   2. Paste manual_enable_rls.sql AND manual_exclusion_constraint.sql into the
--      generated migration.sql (RLS first, then the constraint).
--   3. pnpm prisma migrate dev
-- =============================================================================

ALTER TABLE room_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_units          ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dive_packages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_dive_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events      ENABLE ROW LEVEL SECURITY;
