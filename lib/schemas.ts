import { z } from "zod";

// Shared, server-authoritative contracts. The booking form may use these for
// inline UX validation, but the Server Action MUST re-parse on the server —
// client-side validation is UX only, never a security boundary.

export const DiveAddonInput = z.object({
  divePackageId: z.string().uuid(),
  participants: z.number().int().min(1).max(20),
  preferredDate: z.coerce.date().optional(),
});
export type DiveAddonInput = z.infer<typeof DiveAddonInput>;

export const BookingInput = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(7).max(20),
    roomTypeSlug: z.string().trim().min(1).max(60), // guest books a TYPE; server assigns a unit
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guests: z.number().int().min(1).max(20),
    specialRequests: z.string().trim().max(500).optional(),
    diveAddons: z.array(DiveAddonInput).max(10).default([]),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "Check-out must be after check-in.",
    path: ["checkOut"],
  });
export type BookingInput = z.infer<typeof BookingInput>;

// Discriminated result returned by the createBooking Server Action.
export type BookingActionResult =
  | { ok: true; bookingId: string; confirmationCode: string; viewToken: string; depositAmount: number }
  | { ok: false; message?: string; errors?: Record<string, string> };
