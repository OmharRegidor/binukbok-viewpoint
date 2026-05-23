"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdmin, requireAdmin } from "@/lib/auth";
import { markArrived, verifyDeposit } from "@/lib/db/admin";

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
  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function verifyDepositAction(formData: FormData) {
  const admin = await requireAdmin(); // re-check on the handler itself (not just middleware)
  const id = String(formData.get("bookingId") ?? "");
  if (id) await verifyDeposit(id, admin.id);
  revalidatePath("/admin");
}

export async function markArrivedAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("bookingId") ?? "");
  if (id) await markArrived(id, admin.id);
  revalidatePath("/admin");
}
