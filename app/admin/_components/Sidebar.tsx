"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Users } from "@/components/Icons";

// Nav uses /admin hrefs (work on localhost); active state compares the
// subdomain-clean path so it also lights up on admin.<domain> (clean URLs).
const NAV = [
  { href: "/admin", norm: "/", label: "Overview", Icon: Home },
  { href: "/admin/bookings", norm: "/bookings", label: "Bookings", Icon: Calendar },
  { href: "/admin/account", norm: "/account", label: "Account", Icon: Users },
] as const;

export function Sidebar({ email }: { email: string }) {
  const norm = usePathname().replace(/^\/admin/, "") || "/";

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-navy text-white md:flex">
      <div className="px-6 py-7">
        <p className="text-lg font-extrabold leading-none tracking-wide">BiNuKBoK</p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-[0.22em] text-teal-bright">VieW PoiNT</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, norm: n, label, Icon }) => {
          const active = norm === n;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-[16px] font-semibold transition ${
                active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-teal-deep" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-[17px] font-bold uppercase text-white">
          {email.charAt(0) || "A"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-white">{email || "Admin"}</p>
          <p className="text-xs text-white/60">Admin</p>
        </div>
      </div>
    </aside>
  );
}
