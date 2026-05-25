import { requireAdmin } from "@/lib/auth";
import { getArrivals, getDashboardCounts, getPendingDeposits } from "@/lib/db/admin";
import { BookingActionRow } from "../_components/BookingActionRow";
import { Card, Empty, Kpi, Row } from "../_components/ui";
import { markArrivedAction, markCompletedAction, verifyDepositAction } from "../actions";

export const dynamic = "force-dynamic";

const df = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });

export default async function OverviewPage() {
  const admin = await requireAdmin();
  const [counts, pending, arrivals] = await Promise.all([
    getDashboardCounts(),
    getPendingDeposits(),
    getArrivals(),
  ]);
  const firstName = (admin.email ?? "there").split("@")[0];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy">Overview</h1>
        <p className="mt-1 text-[17px] text-navy/75">Good day, {firstName}.</p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi value={counts.arrivalsToday} label="Arrivals today" />
        <Kpi value={counts.awaitingDeposit} label="Awaiting deposit" />
        <Kpi value={counts.inHouse} label="In-house now" dark />
      </div>

      <Card title="Awaiting deposit" count={pending.length} hint="Confirm once you've received the GCash deposit.">
        {pending.map((b) => (
          <Row
            key={b.id}
            name={b.guest.fullName}
            lines={[
              `${b.roomUnit.roomType.name} · ${df.format(b.checkIn)} → ${df.format(b.checkOut)} · ${b.nights}n`,
              `📞 ${b.guest.phone} · Deposit ₱${b.depositAmount.toLocaleString()} of ₱${b.totalPrice.toLocaleString()}`,
            ]}
            code={b.confirmationCode}
            action={<BookingActionRow bookingId={b.id} label="Confirm deposit" pendingLabel="Saving…" doneLabel="Confirmed" action={verifyDepositAction} />}
          />
        ))}
        {pending.length === 0 && <Empty>No bookings awaiting a deposit.</Empty>}
      </Card>

      <Card title="Arrivals today" count={arrivals.length} hint="Mark guests arrived as they check in.">
        {arrivals.map((b) => (
          <Row
            key={b.id}
            name={b.guest.fullName}
            lines={[`${b.roomUnit.roomType.name} (${b.roomUnit.label}) · ${b.nights}n`]}
            code={b.confirmationCode}
            action={
              b.status === "CHECKED_IN" ? (
                <BookingActionRow bookingId={b.id} label="Check out" pendingLabel="Saving…" doneLabel="Checked out" variant="navy" action={markCompletedAction} />
              ) : (
                <BookingActionRow bookingId={b.id} label="Mark arrived" pendingLabel="Saving…" doneLabel="Arrived" variant="navy" action={markArrivedAction} />
              )
            }
          />
        ))}
        {arrivals.length === 0 && <Empty>No arrivals scheduled for today.</Empty>}
      </Card>
    </div>
  );
}
