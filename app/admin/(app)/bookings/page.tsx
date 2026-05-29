import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { getDashboardCounts, listBookings } from "@/lib/db/admin";
import { Banknote, Bed, Luggage } from "@/components/Icons";
import { Topbar } from "../../_components/Topbar";
import { BookingsFilters } from "../../_components/BookingsFilters";
import { BookingActionRow } from "../../_components/BookingActionRow";
import { StatCard } from "../../_components/cs";
import { StatusPill } from "../../_components/ui";
import { markArrivedAction, markCompletedAction, verifyDepositAction } from "../../actions";
import { DEMO_ARRIVALS_DELTA_PCT, DEMO_OCCUPANCY, DEMO_REVENUE_FORECAST_WEEKLY } from "../../_components/demo";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;
const dateShort = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

// Manila calendar date as a UTC-midnight Date (matches the data layer's convention).
function manilaMidnightUTC(offsetDays = 0): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(new Date(`${parts}T00:00:00.000Z`).getTime() + offsetDays * 86_400_000);
}

function dateRange(range?: string): { from?: Date; to?: Date } {
  switch (range) {
    case "7": return { from: manilaMidnightUTC(-7), to: manilaMidnightUTC(0) };
    case "30": return { from: manilaMidnightUTC(-30), to: manilaMidnightUTC(0) };
    case "upcoming": return { from: manilaMidnightUTC(0) };
    default: return {};
  }
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function actionFor(b: { id: string; status: string }) {
  switch (b.status) {
    case "PENDING_PAYMENT":
    case "PAYMENT_REVIEW":
      return <BookingActionRow size="sm" bookingId={b.id} label="Confirm" pendingLabel="…" doneLabel="Confirmed" action={verifyDepositAction} />;
    case "CONFIRMED":
      return <BookingActionRow size="sm" variant="navy" bookingId={b.id} label="Mark arrived" pendingLabel="…" doneLabel="Arrived" action={markArrivedAction} />;
    case "CHECKED_IN":
      return <BookingActionRow size="sm" variant="navy" bookingId={b.id} label="Check out" pendingLabel="…" doneLabel="Out" action={markCompletedAction} />;
    default:
      return <span className="text-navy/30">—</span>;
  }
}

// up to 3 page buttons centered on the current page
function pageNumbers(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - 1, total - 2));
  const out: number[] = [];
  for (let p = start; p <= Math.min(total, start + 2); p++) out.push(p);
  return out;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; range?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status && sp.status in BookingStatus ? (sp.status as BookingStatus) : undefined;
  const { from, to } = dateRange(sp.range);

  const [counts, { rows, total }] = await Promise.all([
    getDashboardCounts(),
    listBookings({ q: sp.q, status, from, to, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const baseParams = new URLSearchParams();
  if (sp.q) baseParams.set("q", sp.q);
  if (status) baseParams.set("status", status); // validated value only — drops invalid ?status=
  if (sp.range) baseParams.set("range", sp.range);
  const pageHref = (p: number) => {
    const u = new URLSearchParams(baseParams);
    u.set("page", String(p));
    return `/bookings?${u.toString()}`;
  };

  // Out-of-range page (e.g. ?page=99) → bounce to the last real page.
  if (total > 0 && page > totalPages) redirect(pageHref(totalPages));

  const hasFilter = !!(sp.q || sp.status || sp.range);
  const firstShown = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const lastShown = Math.min(page * PER_PAGE, total);

  return (
    <>
      <Topbar title="Bookings Management" />

      <p className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-[14px] font-medium text-amber-900 sm:px-8">
        <span aria-hidden className="text-base">⚠️</span>
        Demo: occupancy, revenue forecast &amp; the arrivals trend are sample data. The bookings table, search, filters &amp; actions are live.
      </p>

      <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Arrivals Today"
            value={String(counts.arrivalsToday)}
            accent={`+${DEMO_ARRIVALS_DELTA_PCT}% from yesterday`}
            accentTone="green"
            icon={<Luggage className="h-5 w-5" />}
          />
          <StatCard
            label="Occupancy Rate"
            value={`${DEMO_OCCUPANCY.pct}%`}
            icon={<Bed className="h-5 w-5" />}
            progress={DEMO_OCCUPANCY.pct}
          />
          <StatCard
            label="Revenue Forecast (Weekly)"
            value={peso.format(DEMO_REVENUE_FORECAST_WEEKLY.amountPhp)}
            icon={<Banknote className="h-5 w-5" />}
            footer={DEMO_REVENUE_FORECAST_WEEKLY.note}
            dark
          />
        </div>

        {/* Filters */}
        <BookingsFilters />

        {/* Current bookings */}
        <section className="rounded-2xl bg-white ring-1 ring-navy/5">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-bold text-navy">
              Current Bookings <span className="text-navy/50">({total})</span>
            </h2>
          </div>

          {rows.length === 0 ? (
            <p className="mx-6 mb-6 rounded-xl border border-dashed border-navy/15 px-5 py-10 text-center text-[15px] text-navy/60">
              {hasFilter ? "No bookings match these filters." : "No bookings yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-navy/15 bg-cream/60 text-[13px] font-bold uppercase tracking-wide text-navy/55">
                    <th className="px-6 py-3">Guest Name</th>
                    <th className="px-3 py-3">Room Type</th>
                    <th className="px-3 py-3">Dates</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="sticky right-0 z-10 bg-cream/95 px-6 py-3 text-right backdrop-blur-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id} className="border-b border-navy/5 last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/15 text-[13px] font-bold text-teal-deep">
                            {initials(b.guest.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-navy">{b.guest.fullName}</p>
                            <p className="font-mono text-[13px] text-navy/60">#{b.confirmationCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-md bg-navy/5 px-3 py-1 text-[13px] font-medium text-navy/80">{b.roomUnit.roomType.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[14px] text-navy/80">
                        {dateShort.format(b.checkIn)} – {dateShort.format(b.checkOut)}
                      </td>
                      <td className="px-3 py-4">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-[15px] font-bold text-navy">{peso.format(b.totalPrice)}</td>
                      <td className="sticky right-0 z-10 bg-white px-6 py-4">
                        <div className="flex justify-end">{actionFor(b)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pt-4">
            <p className="text-[14px] text-navy/60">
              Showing {firstShown}–{lastShown} of {total} booking{total === 1 ? "" : "s"}
            </p>
            {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="rounded-lg border border-navy/15 px-3 py-2 text-[14px] font-semibold text-navy transition hover:bg-navy/5">Previous</Link>
              ) : (
                <span className="rounded-lg border border-navy/10 px-3 py-2 text-[14px] font-semibold text-navy/30">Previous</span>
              )}
              {pageNumbers(page, totalPages).map((p) =>
                p === page ? (
                  <span key={p} className="rounded-lg bg-teal px-3.5 py-2 text-[14px] font-bold text-white">{p}</span>
                ) : (
                  <Link key={p} href={pageHref(p)} className="rounded-lg border border-navy/15 px-3.5 py-2 text-[14px] font-semibold text-navy transition hover:bg-navy/5">{p}</Link>
                ),
              )}
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="rounded-lg border border-navy/15 px-3 py-2 text-[14px] font-semibold text-navy transition hover:bg-navy/5">Next</Link>
              ) : (
                <span className="rounded-lg border border-navy/10 px-3 py-2 text-[14px] font-semibold text-navy/30">Next</span>
              )}
            </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
