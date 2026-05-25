import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

// The owner's email(s), comma-separated in ADMIN_EMAILS. Only these accounts
// may use /admin — a logged-in Supabase user that isn't on the list is NOT an admin.
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Returns the authenticated admin user, or null. Use in actions to gate access.
export async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return adminEmails().includes(user.email.toLowerCase()) ? user : null;
}

// Server-side gate for admin pages/actions. Redirects to login if not an admin.
export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) {
    // Redirect to the REAL route (not the clean "/login") so it also resolves under
    // client soft-navigation — see app/admin/actions.ts adminPath() note.
    redirect("/admin/login");
  }
  return user;
}

