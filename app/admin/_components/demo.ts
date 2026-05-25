// ⚠️ DEMO / MOCK DATA — Coastal Serenity-style dashboard clone.
//
// These metrics have NO backing data source in BiNuKBoK yet: there is no revenue
// tracking, no facility/amenity status system, and no invoicing. The values below
// are placeholders so the redesigned Overview can show the full CS layout.
//
// This deviates from the owner's previously locked scope (see
// docs/superpowers/plans/admin-dashboard-ui.md, "CUT — per owner"). Replace each
// of these with a real query once the corresponding system exists:
//   - occupancy  → in-house room_units ÷ total active room_units
//   - revenue    → SUM(total_price) of bookings in range
//   - facilities → a real amenities/status table
//   - pending    → unpaid balances + maintenance tickets

export const DEMO_OCCUPANCY = { pct: 85, deltaVsLastWeekPct: 4 };

export const DEMO_REVENUE = { amountPhp: 124_500, targetHit: true, deltaVsLastWeekPct: 12 };

export type FacilityState = "OPEN" | "CLOSED";
export const DEMO_FACILITIES: { name: string; state: FacilityState; icon: "pool" | "bar" | "dive" | "kubo" }[] = [
  { name: "Pool Area", state: "OPEN", icon: "pool" },
  { name: "Beachfront Bar", state: "OPEN", icon: "bar" },
  { name: "Dive Center", state: "OPEN", icon: "dive" },
  { name: "Kubo Lounge", state: "CLOSED", icon: "kubo" },
];

export type PendingAction = { title: string; subtitle: string; kind: "invoice" | "repair" };
export const DEMO_PENDING: PendingAction[] = [
  { title: "12 unpaid balances", subtitle: "Due today: ₱42,000", kind: "invoice" },
  { title: "Kubo 2 repair", subtitle: "Aircon malfunction reported", kind: "repair" },
];
