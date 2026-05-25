import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "../_components/Sidebar";

// Sidebar shell for the authenticated admin area. Login stays OUTSIDE this
// route group so it renders without the sidebar.
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar email={admin.email ?? ""} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
