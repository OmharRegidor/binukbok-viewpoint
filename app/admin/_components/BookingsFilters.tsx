"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "@/components/Icons";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All status" },
  { value: "PENDING_PAYMENT", label: "Awaiting deposit" },
  { value: "PAYMENT_REVIEW", label: "Verifying" },
  { value: "CONFIRMED", label: "Booked" },
  { value: "CHECKED_IN", label: "Arrived" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "upcoming", label: "Upcoming" },
];

const field =
  "min-h-[48px] rounded-xl border-2 border-navy/15 bg-white px-3 text-[15px] text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";

// Filters navigate to the bookings page with URL params; the server page reads them
// and calls listBookings(). Applying resets to page 1 (page param omitted).
// Clean path (/bookings) — middleware rewrites onto /admin/bookings for rendering.
export function BookingsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "ALL");
  const [range, setRange] = useState(params.get("range") ?? "all");
  const [isPending, startTransition] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status !== "ALL") sp.set("status", status);
    if (range !== "all") sp.set("range", range);
    const qs = sp.toString();
    startTransition(() => router.push(`/bookings${qs ? `?${qs}` : ""}`));
  }

  return (
    <form onSubmit={apply} className="rounded-2xl bg-white p-5 ring-1 ring-navy/5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_12rem_12rem_auto] lg:items-end">
        <div>
          <label htmlFor="bk-q" className="mb-1.5 block text-[13px] font-bold text-navy/70">Search Guest Bookings</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/40" />
            <input
              id="bk-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by guest name, room #, or booking ID…"
              className={`${field} w-full pl-10`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="bk-status" className="mb-1.5 block text-[13px] font-bold text-navy/70">Booking Status</label>
          <select id="bk-status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} w-full`}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bk-range" className="mb-1.5 block text-[13px] font-bold text-navy/70">Date Range</label>
          <select id="bk-range" value={range} onChange={(e) => setRange(e.target.value)} className={`${field} w-full`}>
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal px-6 text-[15px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 disabled:opacity-70"
        >
          {isPending ? "Applying…" : "Apply Filters"}
        </button>
      </div>
    </form>
  );
}
