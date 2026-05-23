-- Security setup: Row-Level Security + no-double-booking constraint.
-- These cannot be expressed in schema.prisma, so they live here as raw SQL.

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- Supabase auto-exposes a public REST API via the `anon` key. RLS ON with no
-- policies = DENY ALL to that public API. Prisma uses the privileged `postgres`
-- role and bypasses RLS, so the app keeps working; RLS is a defense-in-depth
-- backstop. Authorization is enforced in server code (Server Actions + Clerk).
ALTER TABLE room_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_units          ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dive_packages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_dive_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events      ENABLE ROW LEVEL SECURITY;

-- ── No double-booking ───────────────────────────────────────────────────────
-- btree_gist lets us combine `=` (room_unit_id) with `&&` (date range overlap)
-- in one GiST index. Half-open range '[)' => checkout day == next check-in day
-- is allowed. Cancelled/expired bookings are ignored so their dates free up.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    room_unit_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  )
  WHERE (status NOT IN ('CANCELLED', 'EXPIRED'));
