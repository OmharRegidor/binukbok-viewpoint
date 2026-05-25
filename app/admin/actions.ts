"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAdmin, requireAdmin } from "@/lib/auth";
import { markArrived, markCompleted, verifyDeposit } from "@/lib/db/admin";

// Build a redirect path that stays clean on the admin subdomain (no "/admin"
// prefix there) but still works at localhost/admin during development.
async function adminPath(sub: "" | "/login"): Promise<string> {
  const host = ((await headers()).get("host") ?? "").split(":")[0].toLowerCase();
  const onAdmin = host.startsWith("admin.") || host === process.env.ADMIN_HOST?.toLowerCase();
  return onAdmin ? sub || "/" : `/admin${sub}`;
}

export async function signInAction(_prev: { error: string }, formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };

  // Signed in, but only allowlisted emails are admins.
  const admin = await getAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }
  redirect(await adminPath(""));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(await adminPath("/login"));
}

export type RowState = { ok: boolean; message?: string } | null;

// re-check admin on the handler itself (not just middleware), then run the mutation
async function runBookingAction(
  formData: FormData,
  fn: (id: string, actorId: string) => Promise<{ ok: boolean; message?: string }>,
): Promise<RowState> {
  const admin = await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  if (!id) return { ok: false, message: "Missing booking." };
  const res = await fn(id, admin.id);
  if (res.ok) revalidatePath("/admin", "layout"); // refresh Overview + Bookings lists
  return res;
}

export async function verifyDepositAction(_prev: RowState, formData: FormData): Promise<RowState> {
  return runBookingAction(formData, verifyDeposit);
}
export async function markArrivedAction(_prev: RowState, formData: FormData): Promise<RowState> {
  return runBookingAction(formData, markArrived);
}
export async function markCompletedAction(_prev: RowState, formData: FormData): Promise<RowState> {
  return runBookingAction(formData, markCompleted);
}

export type PasswordState = { ok: boolean; message: string } | null;

// Change the signed-in admin's own Supabase password.
export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  if (password !== confirm) return { ok: false, message: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message || "Couldn't update password." };
  return { ok: true, message: "Password updated." };
}
