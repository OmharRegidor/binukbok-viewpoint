// Presentational building blocks for the admin dashboard pages.

export function Kpi({ value, label, dark }: { value: number | string; label: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 ring-1 ${dark ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-navy/5"}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-white/70" : "text-navy/60"}`}>{label}</p>
      <p className="mt-2 text-4xl font-extrabold">{value}</p>
    </div>
  );
}

export function Card({
  title,
  hint,
  count,
  action,
  children,
}: {
  title: string;
  hint?: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">
            {title}
            {typeof count === "number" && <span className="text-navy/50"> ({count})</span>}
          </h2>
          {hint && <p className="mt-0.5 text-[14px] text-navy/65">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function Row({
  name,
  lines,
  code,
  pill,
  action,
}: {
  name: string;
  lines: string[];
  code?: string;
  pill?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-4 rounded-xl border border-navy/10 p-4">
      <div className="text-[14px]">
        <p className="flex items-center gap-2 text-[17px] font-bold text-navy">
          {name}
          {pill}
        </p>
        {lines.map((l, i) => (
          <p key={i} className="text-navy/70">{l}</p>
        ))}
        {code && <p className="mt-0.5 font-mono text-xs font-bold tracking-wider text-navy/70">{code}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-navy/15 px-5 py-7 text-center text-[15px] text-navy/60">{children}</p>
  );
}

const STATUS: Record<string, { l: string; c: string }> = {
  PENDING_PAYMENT: { l: "Awaiting deposit", c: "bg-amber-100 text-amber-900" },
  PAYMENT_REVIEW: { l: "Verifying", c: "bg-amber-100 text-amber-900" },
  CONFIRMED: { l: "Booked", c: "bg-green-100 text-green-900" },
  CHECKED_IN: { l: "Arrived", c: "bg-blue-100 text-blue-900" },
  COMPLETED: { l: "Completed", c: "bg-gray-200 text-gray-800" },
  CANCELLED: { l: "Cancelled", c: "bg-gray-200 text-gray-800" },
  EXPIRED: { l: "Expired", c: "bg-gray-200 text-gray-800" },
};

export function StatusPill({ status }: { status: string }) {
  const p = STATUS[status] ?? { l: status, c: "bg-gray-200 text-gray-800" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${p.c}`}>{p.l}</span>;
}
