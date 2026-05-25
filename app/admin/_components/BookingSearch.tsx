"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Find a booking by name / code / phone. Updates ?q= on the CURRENT page
// (works on /bookings and /admin/bookings alike) — middleware handles the rewrite.
export function BookingSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(q.trim() ? `${pathname}?q=${encodeURIComponent(q.trim())}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [q, pathname, router]);

  return (
    <input
      type="search"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Find a booking — name, code, or phone"
      aria-label="Find a booking"
      className="mt-6 min-h-[52px] w-full rounded-xl border-2 border-navy/20 bg-white px-5 text-[17px] text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
    />
  );
}
