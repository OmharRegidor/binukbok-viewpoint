// Coastal Serenity-style presentational building blocks for the Overview page.
// All server-renderable (no client hooks). Real data is passed in by the page;
// mock data comes from ./demo.

import Link from "next/link";
import { Anchor, GlassWater, Home, Receipt, Waves, Wrench } from "@/components/Icons";
import { StatusPill } from "./ui";
import type { FacilityState, PendingAction } from "./demo";

// ---------- KPI stat card (occupancy / revenue / forecast) ----------
export function StatCard({
  label,
  value,
  accent,
  accentTone = "teal",
  icon,
  progress,
  footer,
  dark,
}: {
  label: string;
  value: string;
  accent?: string;
  accentTone?: "teal" | "green";
  icon: React.ReactNode;
  progress?: number; // 0-100, renders a bar pinned to the bottom
  footer?: React.ReactNode;
  dark?: boolean; // dark navy accent card (e.g. Revenue Forecast)
}) {
  return (
    <div className={`flex flex-col rounded-2xl p-6 ring-1 ${dark ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-navy/5"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[15px] font-bold ${dark ? "text-white/90" : "text-navy"}`}>{label}</p>
        <span className={dark ? "text-white/45" : "text-navy/40"}>{icon}</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <p className={`text-4xl font-extrabold leading-none ${dark ? "text-white" : "text-navy"}`}>{value}</p>
        {accent && (
          <span
            className={`pb-0.5 text-[14px] font-bold ${
              dark ? "text-teal-bright" : accentTone === "green" ? "text-green-600" : "text-teal-deep"
            }`}
          >
            {accent}
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="mt-auto pt-6">
          <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? "bg-white/20" : "bg-navy/10"}`}>
            <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        </div>
      )}
      {footer && <div className={`mt-auto pt-5 text-[14px] ${dark ? "text-white/80" : "text-navy/65"}`}>{footer}</div>}
    </div>
  );
}

// ---------- Dark "Expected Arrivals" card with CTA ----------
export function ExpectedArrivalsCard({
  count,
  icon,
  ctaLabel,
  ctaHref,
}: {
  count: number;
  icon: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-navy p-6 text-white ring-1 ring-navy">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold text-white/90">Expected Arrivals</p>
        <span className="text-white/45">{icon}</span>
      </div>
      <p className="mt-3 text-4xl font-extrabold leading-none">{count}</p>
      <div className="mt-auto pt-6">
        <Link
          href={ctaHref}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-teal px-6 text-[16px] font-bold text-white transition hover:bg-teal-bright"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

// ---------- Facility status ----------
const FAC_ICON = { pool: Waves, bar: GlassWater, dive: Anchor, kubo: Home } as const;

export function FacilityStatus({
  items,
  updatedLabel,
}: {
  items: { name: string; state: FacilityState; icon: keyof typeof FAC_ICON }[];
  updatedLabel: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy">Facility Status</h2>
        <p className="text-[13px] text-navy/50">{updatedLabel}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((f) => {
          const Icon = FAC_ICON[f.icon];
          const open = f.state === "OPEN";
          return (
            <div key={f.name} className="flex flex-col items-center gap-2 rounded-xl bg-cream/60 p-4 text-center ring-1 ring-navy/5">
              <Icon className={`h-6 w-6 ${open ? "text-teal-deep" : "text-navy/35"}`} />
              <p className="text-[14px] font-semibold text-navy">{f.name}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                  open ? "bg-teal/15 text-teal-deep" : "bg-navy/10 text-navy/50"
                }`}
              >
                {f.state}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Pending actions ----------
export function PendingActions({ items }: { items: PendingAction[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <h2 className="text-xl font-bold text-navy">Pending Actions</h2>
      <div className="mt-5 space-y-3">
        {items.map((a, i) => {
          const Icon = a.kind === "invoice" ? Receipt : Wrench;
          return (
            <div key={`${a.kind}-${i}`} className="flex items-center gap-3 rounded-xl border border-navy/10 p-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  a.kind === "invoice" ? "bg-coral/10 text-coral-dark" : "bg-teal/10 text-teal-deep"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-navy">{a.title}</span>
                <span className="block truncate text-[13px] text-navy/60">{a.subtitle}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Recent arrivals table ----------
export type ArrivalRow = { id: string; name: string; room: string; date: string; status: string; code: string };

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function ArrivalsTable({ rows }: { rows: ArrivalRow[] }) {
  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-navy">Recent Arrivals</h2>
        <Link href="/admin/bookings" className="text-[14px] font-bold text-teal-deep transition hover:text-teal">
          View all bookings →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-navy/15 px-5 py-8 text-center text-[15px] text-navy/60">
          No arrivals scheduled for today.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-navy/10 text-[13px] font-bold uppercase tracking-wide text-navy/55">
                <th className="px-3 py-3">Guest Name</th>
                <th className="px-3 py-3">Room Type</th>
                <th className="px-3 py-3">Check-in</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/15 text-[13px] font-bold text-teal-deep">
                        {initials(r.name)}
                      </span>
                      <span className="text-[15px] font-semibold text-navy">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[15px] text-navy/80">{r.room}</td>
                  <td className="px-3 py-4 text-[15px] text-navy/80">{r.date}</td>
                  <td className="px-3 py-4">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <Link
                      href={`/admin/bookings?q=${encodeURIComponent(r.code)}`}
                      className="text-[14px] font-bold text-teal-deep transition hover:text-teal"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
