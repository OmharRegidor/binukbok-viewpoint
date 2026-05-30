"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "@/components/Icons";
import { ADMIN_NAV, activeNorm } from "./nav";

// Coastal Serenity-style top bar: page title + notifications + search + LIVE,
// plus a horizontal nav strip on mobile (the sidebar is hidden below md).
// Bell is presentational (no notification system yet); search jumps to the
// real booking lookup. "Live" reflects that arrivals/bookings are live data.
export function Topbar({ title }: { title: string }) {
  const norm = activeNorm(usePathname());

  return (
    <header className="sticky top-0 z-10 border-b border-navy/10 bg-cream/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <h1 className="text-2xl font-extrabold text-navy sm:text-[28px]">{title}</h1>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Notifications not yet implemented — presentational only. */}
          <span
            aria-hidden
            title="Notifications coming soon"
            className="grid h-11 w-11 cursor-default place-items-center rounded-full text-navy/35"
          >
            <Bell className="h-5 w-5" />
          </span>

          <Link
            href="/bookings"
            aria-label="Search bookings"
            className="grid h-11 w-11 place-items-center rounded-full text-navy/70 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
          >
            <Search className="h-5 w-5" />
          </Link>

          <span className="mx-1 hidden h-7 w-px bg-navy/15 sm:block" />

          <span className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy">
            Live
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          </span>
        </div>
      </div>

      {/* Mobile navigation — the sidebar is hidden below md, so surface nav here. */}
      <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3 md:hidden">
        {ADMIN_NAV.map(({ href, norm: n, label, Icon }) => {
          const active = norm === n;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold transition ${
                active ? "bg-teal text-white" : "bg-white text-navy/70 ring-1 ring-navy/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
