import { getCalendarMonth, getPendingCheckIns, getTodayStats } from "@/lib/db/calendar";
import { manilaToday } from "@/lib/db/dates";
import { Topbar } from "../../_components/Topbar";
import {
  CalendarGrid,
  DailySummaryButton,
  MonthNav,
  PendingCheckIns,
  QuickBookingButton,
  QuickResortView,
  RoomStatusCard,
  TodayActivity,
} from "../../_components/calendar-ui";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const sp = await searchParams;
  // A duplicated ?month= arrives as an array — take the first; getCalendarMonth
  // validates the value and falls back to the current month if it's malformed.
  const monthParam = Array.isArray(sp.month) ? sp.month[0] : sp.month;

  // Compute "today" once so every card on the page agrees, even across a midnight tick.
  const today = manilaToday();
  const [month, stats, pending] = await Promise.all([
    getCalendarMonth(monthParam, today),
    getTodayStats(today),
    getPendingCheckIns(today),
  ]);

  return (
    <>
      <Topbar title="Calendar" />

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar + pending check-ins */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
              <MonthNav month={month} />
              <CalendarGrid month={month} />
            </section>

            <PendingCheckIns rows={pending} />
          </div>

          {/* Sidebar — monitoring data first, actions lower (admins open this to scan,
              not to book). */}
          <aside className="space-y-6">
            <TodayActivity stats={stats} />
            <RoomStatusCard stats={stats} />
            <QuickResortView occupancyPct={stats.occupancyPct} />
            <QuickBookingButton />
            <DailySummaryButton />
          </aside>
        </div>
      </div>
    </>
  );
}
