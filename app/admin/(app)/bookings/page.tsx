import { getPendingDeposits, searchBookings } from "@/lib/db/admin";
import { BookingActionRow } from "../../_components/BookingActionRow";
import { BookingSearch } from "../../_components/BookingSearch";
import { Card, Empty, Row, StatusPill } from "../../_components/ui";
import { verifyDepositAction } from "../../actions";

export const dynamic = "force-dynamic";

const df = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [results, pending] = await Promise.all([
    q ? searchBookings(q) : Promise.resolve([]),
    getPendingDeposits(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy">Bookings</h1>
        <p className="mt-1 text-[17px] text-navy/75">Find a booking, confirm deposits, manage stays.</p>
      </header>

      <BookingSearch />

      {q && (
        <Card title="Search results" count={results.length} hint={`Matches for "${q}"`}>
          {results.map((b) => (
            <Row
              key={b.id}
              name={b.guest.fullName}
              pill={<StatusPill status={b.status} />}
              lines={[
                `${b.roomUnit.roomType.name} (${b.roomUnit.label}) · ${df.format(b.checkIn)} → ${df.format(b.checkOut)} · ${b.nights}n`,
                `📞 ${b.guest.phone}`,
              ]}
              code={b.confirmationCode}
            />
          ))}
          {results.length === 0 && <Empty>No bookings match that search.</Empty>}
        </Card>
      )}

      <Card title="Awaiting deposit" count={pending.length} hint="Confirm once you've received the GCash deposit.">
        {pending.map((b) => (
          <Row
            key={b.id}
            name={b.guest.fullName}
            pill={<StatusPill status={b.status} />}
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
    </div>
  );
}
