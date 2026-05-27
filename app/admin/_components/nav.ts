import type { ComponentType, SVGProps } from "react";
import { Calendar, ClipboardList, LayoutGrid, Settings, Users } from "@/components/Icons";

export type NavItem = {
  href: string;
  norm: string; // subdomain-clean path used for active-state comparison
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

// Single source of truth for admin navigation (used by Sidebar + mobile Topbar nav).
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", norm: "/", label: "Overview", Icon: LayoutGrid },
  { href: "/admin/bookings", norm: "/bookings", label: "Bookings", Icon: ClipboardList },
{ href: "/admin/calendar", norm: "/calendar", label: "Calendar", Icon: Calendar },
  { href: "/admin/resort-config", norm: "/resort-config", label: "Resort Config", Icon: Settings },
  { href: "/admin/account", norm: "/account", label: "Account", Icon: Users },
];

// Normalize a pathname so active state works on BOTH the admin subdomain
// (clean paths like "/bookings") and localhost (/admin/bookings).
export function activeNorm(pathname: string): string {
  return pathname.replace(/^\/admin/, "") || "/";
}
