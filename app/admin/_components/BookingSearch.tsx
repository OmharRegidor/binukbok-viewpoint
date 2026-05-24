"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Find a booking by name / code / phone. Routes use subdomain-clean paths
// ("/", "/?q=") — middleware rewrites them onto /admin.
export function BookingSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
    }, 300);
    return () => clearTimeout(t);
  }, [q, router]);

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
