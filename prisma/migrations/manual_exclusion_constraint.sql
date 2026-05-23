-- =============================================================================
-- No-double-booking EXCLUDE constraint  (raw SQL — Prisma can't express this)
-- =============================================================================
-- Prisma does not support PostgreSQL exclusion constraints in schema.prisma
-- (prisma/prisma#17514), so this ships as a raw-SQL migration.
--
-- HOW TO APPLY (after `prisma migrate dev` has created the base tables):
--   1. pnpm prisma migrate dev --create-only --name booking_exclusion_constraint
--   2. Paste the SQL below into the generated migration.sql
--   3. pnpm prisma migrate dev   (applies it)
--
-- It makes overlapping bookings on the SAME physical unit structurally
-- impossible at the database level — no application locking required.
-- =============================================================================

-- Lets us combine `=` (on room_unit_id) with `&&` (on the date range) in one GiST index.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    room_unit_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  -- Half-open range '[)' => checkout day == next check-in day is allowed.
  -- Cancelled / expired bookings are ignored so their dates free up again.
  WHERE (status NOT IN ('CANCELLED', 'EXPIRED'));
