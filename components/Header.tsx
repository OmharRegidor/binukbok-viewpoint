"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const nav = [
  { href: "/", label: "Home" },
  { href: "/accommodations", label: "Accommodations" },
  { href: "/diving", label: "Diving" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Toggle the solid bar once the page has scrolled past the top of the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); // sync on mount (e.g. refresh while scrolled)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Transparent over the dark hero at the top; solid white once scrolled or
  // when the mobile menu is open (so its links stay readable).
  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-white/95 shadow-sm backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={48} />
          <span
            className={`text-lg font-bold transition-colors ${
              solid ? "text-navy" : "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]"
            }`}
          >
            BiNuKBoK
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            const linkClass = solid
              ? active
                ? "text-teal"
                : "text-navy/70 hover:text-teal"
              : active
                ? "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]"
                : "text-white/85 hover:text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${linkClass}`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/book"
            className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark"
          >
            Book Now
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors md:hidden ${
            solid ? "text-navy" : "text-white"
          }`}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-black/5 bg-white px-5 pb-4 pt-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-navy/80"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full bg-coral px-5 py-2 text-center text-sm font-semibold text-white"
          >
            Book Now
          </Link>
        </nav>
      )}
    </header>
  );
}
