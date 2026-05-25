// Shared date helpers for the data layer. All DB DATE columns come back as
// UTC-midnight Dates, and we represent a "Manila calendar date" (Asia/Manila,
// UTC+8, no DST) as a UTC-midnight Date so it compares directly to those columns.

export const DAY_MS = 24 * 60 * 60 * 1000;

// "Today" in Asia/Manila, as a UTC-midnight Date for DATE-column comparison.
export function manilaToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
  return new Date(`${parts}T00:00:00.000Z`);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}
