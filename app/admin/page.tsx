import { requireAdmin } from "@/lib/auth";
import { getArrivals, getPendingDeposits } from "@/lib/db/admin";
import { markArrivedAction, signOutAction, verifyDepositAction } from "./actions";

export const dynamic = "force-dynamic";

const df = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [pending, arrivals] = await Promise.all([getPendingDeposits(), getArrivals()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-navy/70">{admin.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white">
            Sign out
          </button>
        </form>
      </div>

      {/* Pending deposits */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy">
          Awaiting deposit <span className="text-navy/50">({pending.length})</span>
        </h2>
        <p className="mt-1 text-sm text-navy/65">Confirm once you&apos;ve received the GCash deposit.</p>

        {pending.length === 0 ? (
          <Empty>No bookings awaiting a deposit.</Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((b) => (
              <li key={b.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-navy/5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="text-[15px]">
                    <p className="text-[17px] font-bold text-navy">{b.guest.fullName}</p>
                    <p className="text-navy/75">{b.roomUnit.roomType.name} · {df.format(b.checkIn)} → {df.format(b.checkOut)} · {b.nights}n</p>
                    <p className="mt-1 text-navy/70">📞 {b.guest.phone} · Deposit ₱{b.depositAmount.toLocaleString()} of ₱{b.totalPrice.toLocaleString()}</p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-wider text-navy/80">{b.confirmationCode}</p>
                  </div>
                  <form action={verifyDepositAction}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button className="rounded-lg bg-teal px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-bright">
                      Confirm deposit
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Today's arrivals */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-navy">
          Arrivals today <span className="text-navy/50">({arrivals.length})</span>
        </h2>
        <p className="mt-1 text-sm text-navy/65">Mark guests arrived as they check in.</p>

        {arrivals.length === 0 ? (
          <Empty>No arrivals scheduled for today.</Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {arrivals.map((b) => (
              <li key={b.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-navy/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-[15px]">
                    <p className="text-[17px] font-bold text-navy">{b.guest.fullName}</p>
                    <p className="text-navy/75">{b.roomUnit.roomType.name} ({b.roomUnit.label}) · {b.nights}n</p>
                    <p className="mt-1 font-mono text-sm font-bold tracking-wider text-navy/80">{b.confirmationCode}</p>
                  </div>
                  {b.status === "CHECKED_IN" ? (
                    <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-900">Arrived ✓</span>
                  ) : (
                    <form action={markArrivedAction}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button className="rounded-lg bg-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy/90">
                        Mark arrived
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-xl border border-dashed border-navy/15 bg-white/50 px-5 py-8 text-center text-navy/60">{children}</p>;
}
