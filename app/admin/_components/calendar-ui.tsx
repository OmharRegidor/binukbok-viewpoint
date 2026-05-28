// Presentational building blocks for the admin Availability Calendar.
// All server-renderable (no client hooks) — month navigation is link-based so the
// page can stay a server component. Real data is passed in by the page.

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bed, ChevronRight, LogIn } from "@/components/Icons";
import type { CalendarDay, CalendarMonth, PendingCheckIn, TodayStats } from "@/lib/db/calendar";

const BASE = "/admin/calendar";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const cellDateFmt = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const checkInFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });

// ── Month header: title + room-count subtitle + prev/next/today nav ──────────
export function MonthNav({ month }: { month: CalendarMonth }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold text-navy">Availability calendar</h2>
        <p className="mt-0.5 text-[14px] text-navy/65">
          Live availability across {month.totalUnits} {month.totalUnits === 1 ? "room" : "rooms"} of all types
        </p>
      </div>

      <div className="flex items-center gap-2">
        {!month.isCurrentMonth && (
          <Link
            href={BASE}
            className="inline-flex min-h-[44px] items-center rounded-full px-3 text-[13px] font-bold text-teal-deep transition hover:bg-teal/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
          >
            Today
          </Link>
        )}
        <div className="flex items-center gap-1 rounded-full border border-navy/15 bg-white p-1">
          <Link
            href={`${BASE}?month=${month.prevParam}`}
            aria-label="Previous month"
            className="grid h-11 w-11 place-items-center rounded-full text-navy/70 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Link>
          <span className="min-w-[9.5rem] text-center text-[15px] font-bold text-navy">{month.label}</span>
          <Link
            href={`${BASE}?month=${month.nextParam}`}
            aria-label="Next month"
            className="grid h-11 w-11 place-items-center rounded-full text-navy/70 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── One day cell ─────────────────────────────────────────────────────────────
function DayCell({ d }: { d: CalendarDay }) {
  if (!d.inMonth) {
    return <div role="gridcell" aria-hidden className="min-h-[84px] rounded-xl bg-cream/40 sm:min-h-[96px]" />;
  }

  const full = d.totalUnits > 0 && d.freeUnits === 0;
  const partial = !full && d.bookedUnits > 0;

  const pill = full
    ? { label: "Full", cls: "bg-coral/15 text-coral-dark" }
    : partial
      ? { label: `${d.freeUnits} free`, cls: "bg-amber-100 text-amber-900" }
      : { label: "Available", cls: "bg-teal/15 text-teal-deep" };

  const parts = [`${d.freeUnits} of ${d.totalUnits} rooms free`];
  if (d.arrivals) parts.push(`${d.arrivals} arrival${d.arrivals === 1 ? "" : "s"}`);
  if (d.departures) parts.push(`${d.departures} departure${d.departures === 1 ? "" : "s"}`);

  return (
    <div
      role="gridcell"
      aria-label={`${cellDateFmt.format(new Date(`${d.date}T00:00:00Z`))}: ${parts.join(", ")}`}
      className={`flex min-h-[84px] flex-col gap-1.5 rounded-xl p-2 ring-1 transition sm:min-h-[96px] ${
        d.isToday ? "bg-teal/5 ring-2 ring-teal" : "bg-white ring-navy/10"
      } ${d.isPast ? "opacity-60" : ""}`}
    >
      <span
        className={`text-[13px] font-bold ${
          d.isToday ? "grid h-6 w-6 place-items-center rounded-full bg-navy text-white" : "text-navy"
        }`}
      >
        {d.day}
      </span>

      <span className={`rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold ${pill.cls}`}>{pill.label}</span>

      {(d.arrivals > 0 || d.departures > 0) && (
        <div className="mt-auto flex flex-wrap gap-1 text-[10px] font-bold">
          {d.arrivals > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded bg-teal/15 px-1 py-0.5 text-teal-deep">
              <LogIn className="h-3 w-3" />
              {d.arrivals} in
            </span>
          )}
          {d.departures > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded bg-coral/15 px-1 py-0.5 text-coral-dark">
              <ArrowRight className="h-3 w-3" />
              {d.departures} out
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Full month grid ──────────────────────────────────────────────────────────
export function CalendarGrid({ month }: { month: CalendarMonth }) {
  return (
    <div className="mt-5 overflow-x-auto p-1">
      <div role="grid" aria-label={`Room availability for ${month.label}`} className="min-w-[640px]">
        <div role="row" className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((w) => (
            <div role="columnheader" key={w} className="pb-1 text-center text-[12px] font-bold uppercase tracking-wide text-navy/55">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 space-y-2">
          {month.weeks.map((week, i) => (
            <div role="row" key={week[0]?.date ?? i} className="grid grid-cols-7 gap-2">
              {week.map((d) => (
                <DayCell key={d.date} d={d} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar: Today's Activity (arrivals / departures) ────────────────────────
export function TodayActivity({ stats }: { stats: TodayStats }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <h2 className="text-lg font-bold text-navy">Today&rsquo;s Activity</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-teal/10 p-4">
          <LogIn className="h-5 w-5 text-teal-deep" />
          <p className="mt-2 text-3xl font-extrabold leading-none text-navy">{stats.arrivals}</p>
          <p className="mt-1 text-[13px] font-semibold text-navy/65">Arrivals</p>
        </div>
        <div className="rounded-xl bg-coral/10 p-4">
          <ArrowRight className="h-5 w-5 text-coral-dark" />
          <p className="mt-2 text-3xl font-extrabold leading-none text-navy">{stats.departures}</p>
          <p className="mt-1 text-[13px] font-semibold text-navy/65">Departures</p>
        </div>
      </div>
    </section>
  );
}

// ── Sidebar: Rooms tonight (live occupancy — replaces the demo "housekeeping") ─
export function RoomStatusCard({ stats }: { stats: TodayStats }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
        <Bed className="h-5 w-5 text-navy/60" />
        Rooms Tonight
      </h2>
      <div className="mt-4 space-y-3">
        <StatusRow accent="bg-coral" value={stats.occupied} label="Occupied" sub="Guests in-house" />
        <StatusRow accent="bg-teal" value={stats.free} label="Available" sub="Ready to book" />
      </div>
    </section>
  );
}

function StatusRow({ accent, value, label, sub }: { accent: string; value: number; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-navy/10 p-3">
      <span className={`h-10 w-1.5 shrink-0 rounded-full ${accent}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-navy">
          {value} {value === 1 ? "room" : "rooms"}
        </span>
        <span className="block text-[13px] text-navy/60">{label} · {sub}</span>
      </span>
    </div>
  );
}

// ── Sidebar: Quick resort view (image + live occupancy) ──────────────────────
export function QuickResortView({ occupancyPct }: { occupancyPct: number }) {
  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-navy/5">
      <div className="relative h-40 w-full">
        <Image src="/images/hero-bg.png" alt="BiNuKBoK View Point Resort" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
          <p className="text-[15px] font-extrabold leading-tight">BiNuKBoK VieW PoiNT</p>
          <p className="text-[13px] font-semibold text-white/90">{occupancyPct}% occupancy tonight</p>
        </div>
      </div>
    </section>
  );
}

// ── Pending guest check-ins (live: today's confirmed arrivals) ───────────────
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export function PendingCheckIns({ rows }: { rows: PendingCheckIn[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-navy">
          Pending Guest Check-ins{rows.length > 0 && <span className="text-navy/50"> ({rows.length})</span>}
        </h2>
        <Link href="/admin/bookings?range=upcoming" className="text-[14px] font-bold text-teal-deep transition hover:text-teal">
          View all →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-navy/15 px-5 py-8 text-center text-[15px] text-navy/60">
          No guests are due to check in today.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/10 p-3 sm:flex-nowrap">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal/15 text-[13px] font-bold text-teal-deep">
                  {initials(b.guest.fullName)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-navy">{b.guest.fullName}</span>
                  <span className="block text-[13px] text-navy/65">
                    {b.roomUnit.roomType.name} · {b.roomUnit.label} · arrives {checkInFmt.format(b.checkIn)}
                  </span>
                </span>
              </div>
              <Link
                href={`/admin/bookings?q=${encodeURIComponent(b.confirmationCode)}`}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-navy px-4 text-[14px] font-bold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 sm:w-auto"
              >
                Check in
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
