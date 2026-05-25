"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, activeNorm } from "./nav";

export function Sidebar({ email }: { email: string }) {
  const norm = activeNorm(usePathname());

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-navy/10 bg-white md:flex">
      <div className="px-6 py-7">
        <p className="text-2xl font-extrabold leading-none text-navy">BiNuKBoK</p>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-teal">View Point</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {ADMIN_NAV.map(({ href, norm: n, label, Icon }) => {
          const active = norm === n;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-[16px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40 ${
                active ? "bg-teal/10 text-teal-deep" : "text-navy/70 hover:bg-navy/5 hover:text-navy"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-navy text-[17px] font-bold uppercase text-white">
            {email.charAt(0) || "A"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-navy">Resort Manager</p>
            <p className="truncate text-xs text-navy/55">{email || "BiNuKBoK"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
