"use server";

import { createBooking } from "@/lib/db/bookings";
import type { BookingActionResult } from "@/lib/schemas";

// Server Action called by BookingForm. Thin wrapper so the form imports a
// stable action while the logic lives in the (testable) repository module.
export async function createBookingAction(raw: unknown): Promise<BookingActionResult> {
  return createBooking(raw);
}
