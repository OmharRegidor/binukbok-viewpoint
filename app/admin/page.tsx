import { requireAdmin } from "@/lib/auth";
import { getArrivals, getDashboardCounts, getPendingDeposits, searchBookings } from "@/lib/db/admin";
import { BookingActionRow } from "./_components/BookingActionRow";
import { BookingSearch } from "./_components/BookingSearch";
import { markArrivedAction, markCompletedAction, signOutAction, verifyDepositAction } from "./actions";

export const dynamic = "force-dynamic";

const df = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });

const PILL: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Awaiting deposit", cls: "bg-amber-100 text-amber-900" },
  PAYMENT_REVIEW: { label: "Verifying", cls: "bg-amber-100 text-amber-900" },
  CONFIRMED: { label: "Booked", cls: "bg-green-100 text-green-900" },
  CHECKED_IN: { label: "Arrived", cls: "bg-blue-100 text-blue-900" },
  COMPLETED: { label: "Completed", cls: "bg-gray-200 text-gray-800" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-200 text-gray-800" },
  EXPIRED: { label: "Expired", cls: "bg-gray-200 text-gray-800" },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const [counts, pending, arrivals, results] = await Promise.all([
    getDashboardCounts(),
    getPendingDeposits(),
    getArrivals(),
    q ? searchBookings(q) : Promise.resolve([]),
  ]);
  const firstName = (admin.email ?? "there").split("@")[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Good day, {firstName}</h1>
          <p className="mt-1 text-[17px] text-navy/75">
            {counts.arrivalsToday} arrival{counts.arrivalsToday === 1 ? "" : "s"} today · {counts.awaitingDeposit} awaiting deposit
          </p>
        </div>
        <form action={signOutAction}>
          <button className="min-h-[48px] rounded-lg border border-navy/25 px-4 text-[15px] font-semibold text-navy transition hover:bg-navy hover:text-white">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Kpi n={counts.arrivalsToday} label="Arrivals today" />
        <Kpi n={counts.awaitingDeposit} label="Awaiting deposit" />
        <Kpi n={counts.inHouse} label="In-house now" />
      </div>

      <BookingSearch />

      {q && (
        <Section title="Search results" count={results.length} hint={`Matches for "${q}"`}>
          {results.map((b) => (
            <Row
              key={b.id}
              title={b.guest.fullName}
              pill={b.status}
              lines={[
                `${b.roomUnit.roomType.name} · ${df.format(b.checkIn)} → ${df.format(b.checkOut)} · ${b.nights}n`,
                `📞 ${b.guest.phone}`,
              ]}
              code={b.confirmationCode}
            />
          ))}
          {results.length === 0 && <Empty>No bookings match that search.</Empty>}
        </Section>
      )}

      <Section title="Awaiting deposit" count={pending.length} hint="Confirm once you've received the GCash deposit.">
        {pending.map((b) => (
          <Row
            key={b.id}
            title={b.guest.fullName}
            lines={[
              `${b.roomUnit.roomType.name} · ${df.format(b.checkIn)} → ${df.format(b.checkOut)} · ${b.nights}n`,
              `📞 ${b.guest.phone} · Deposit ₱${b.depositAmount.toLocaleString()} of ₱${b.totalPrice.toLocaleString()}`,
            ]}
            code={b.confirmationCode}
            action={<BookingActionRow bookingId={b.id} label="Confirm deposit" pendingLabel="Saving…" doneLabel="Confirmed" action={verifyDepositAction} />}
          />
        ))}
        {pending.length === 0 && <Empty>No bookings awaiting a deposit.</Empty>}
      </Section>

      <Section title="Arrivals today" count={arrivals.length} hint="Mark guests arrived as they check in.">
        {arrivals.map((b) => (
          <Row
            key={b.id}
            title={b.guest.fullName}
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
      </Section>
    </div>
  );
}

function Kpi({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center ring-1 ring-navy/5">
      <p className="text-5xl font-extrabold text-teal-deep">{n}</p>
      <p className="mt-1 text-[15px] font-medium text-navy/75">{label}</p>
    </div>
  );
}

function Section({ title, count, hint, children }: { title: string; count: number; hint: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-xl font-bold text-navy">
        {title} <span className="text-navy/55">({count})</span>
      </h2>
      <p className="mt-1 text-[15px] text-navy/75">{hint}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Row({
  title,
  lines,
  code,
  action,
  pill,
}: {
  title: string;
  lines: string[];
  code: string;
  action?: React.ReactNode;
  pill?: string;
}) {
  const p = pill ? PILL[pill] : null;
  return (
    <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-navy/5">
      <div className="text-[15px]">
        <p className="flex items-center gap-2 text-[18px] font-bold text-navy">
          {title}
          {p && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.cls}`}>{p.label}</span>}
        </p>
        {lines.map((l, i) => (
          <p key={i} className="text-navy/75">{l}</p>
        ))}
        <p className="mt-1 font-mono text-sm font-bold tracking-wider text-navy/80">{code}</p>
      </div>
      {action}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-navy/15 bg-white/50 px-5 py-8 text-center text-[16px] text-navy/65">
      {children}
    </p>
  );
}
