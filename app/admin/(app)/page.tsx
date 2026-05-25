import { getArrivals, getDashboardCounts } from "@/lib/db/admin";
import { Banknote, Bed, Luggage, TrendingUp } from "@/components/Icons";
import { Topbar } from "../_components/Topbar";
import { ArrivalsTable, ExpectedArrivalsCard, FacilityStatus, PendingActions, StatCard, type ArrivalRow } from "../_components/cs";
import { DEMO_FACILITIES, DEMO_OCCUPANCY, DEMO_PENDING, DEMO_REVENUE } from "../_components/demo";

export const dynamic = "force-dynamic";

const df = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export default async function OverviewPage() {
  const [counts, arrivals] = await Promise.all([getDashboardCounts(), getArrivals()]);

  const rows: ArrivalRow[] = arrivals.map((b) => ({
    id: b.id,
    name: b.guest.fullName,
    room: b.roomUnit.roomType.name,
    date: df.format(b.checkIn),
    status: b.status,
    code: b.confirmationCode,
  }));

  return (
    <>
      <Topbar title="Overview Dashboard" />

      <p className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-[14px] font-medium text-amber-900 sm:px-8">
        <span aria-hidden className="text-base">⚠️</span>
        Demo: occupancy, revenue, facility status &amp; pending actions show sample data (no live source yet). Arrivals &amp; bookings are live.
      </p>

      <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Daily Occupancy"
            value={`${DEMO_OCCUPANCY.pct}%`}
            accent={`+${DEMO_OCCUPANCY.deltaVsLastWeekPct}% vs LW`}
            accentTone="green"
            icon={<Bed className="h-5 w-5" />}
            progress={DEMO_OCCUPANCY.pct}
          />
          <StatCard
            label="Daily Revenue"
            value={peso.format(DEMO_REVENUE.amountPhp)}
            accent={DEMO_REVENUE.targetHit ? "Target hit" : undefined}
            icon={<Banknote className="h-5 w-5" />}
            footer={
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-teal-deep" />
                {DEMO_REVENUE.deltaVsLastWeekPct}% increase from previous week
              </span>
            }
          />
          <ExpectedArrivalsCard
            count={counts.arrivalsToday}
            icon={<Luggage className="h-5 w-5" />}
            ctaLabel="Check-in Center"
            ctaHref="/admin/bookings"
          />
        </div>

        {/* Facility status + pending actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FacilityStatus items={DEMO_FACILITIES} updatedLabel="Sample data" />
          </div>
          <PendingActions items={DEMO_PENDING} />
        </div>

        {/* Recent arrivals (live) */}
        <ArrivalsTable rows={rows} />
      </div>
    </>
  );
}
