import type { ComponentType, SVGProps } from "react";
import { Calendar, ClipboardList, LayoutGrid, Users } from "@/components/Icons";

export type NavItem = {
  href: string;
  norm: string; // subdomain-clean path used for active-state comparison
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Single source of truth for admin navigation (used by Sidebar + mobile Topbar nav).
// hrefs are CLEAN subdomain paths (no /admin) so navigation shows /calendar, not
// /admin/calendar. Middleware rewrites these onto the real /admin/* routes for
// rendering (no redirect, no extra round-trip). `norm` already matches the clean
// path; activeNorm() also tolerates a /admin prefix for localhost dev access.
export const ADMIN_NAV: NavItem[] = [
  { href: "/", norm: "/", label: "Overview", Icon: LayoutGrid },
  { href: "/bookings", norm: "/bookings", label: "Bookings", Icon: ClipboardList },
  { href: "/calendar", norm: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/account", norm: "/account", label: "Account", Icon: Users },
];

// Normalize a pathname so active state works on BOTH the admin subdomain
// (clean paths like "/bookings") and localhost (/admin/bookings).
export function activeNorm(pathname: string): string {
  return pathname.replace(/^\/admin/, "") || "/";
}
