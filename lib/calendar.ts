// Builds a prefilled Google Calendar "Add to Calendar" URL — no OAuth, no backend.
// The guest taps it, Google Calendar opens with the stay filled in, they hit Save.

// DATE-only columns come back as UTC-midnight Dates; use UTC parts to avoid TZ shift.
function fmtDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function googleCalendarUrl(opts: {
  title: string;
  checkIn: Date;
  checkOut: Date; // all-day end is exclusive in Google Calendar, so checkout day works directly
  details: string;
  location: string;
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmtDate(opts.checkIn)}/${fmtDate(opts.checkOut)}`,
    details: opts.details,
    location: opts.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
