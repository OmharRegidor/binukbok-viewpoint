import { BookingStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { BookingInput, type BookingActionResult } from "../schemas";
import { generateConfirmationCode, generateViewToken } from "../tokens";

// Relative imports (not the @/ alias) so this module is also runnable from tsx scripts.

const DEPOSIT_AMOUNT = 500; // ₱ fixed deposit (v2)
const HOLD_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Bookings in these states no longer hold their dates.
const RELEASED_STATES: BookingStatus[] = [BookingStatus.CANCELLED, BookingStatus.EXPIRED];

// "Today" as a UTC-midnight Date, computed in Asia/Manila (UTC+8, no DST).
function manilaToday(): Date {
  const m = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate()));
}

function isOverlapError(e: unknown): boolean {
  return /no_overlap|exclusion|23P01|conflicting key value/i.test(String((e as Error)?.message ?? e));
}

// Prisma relation predicate: a unit is taken if it has any active booking whose
// range overlaps [checkIn, checkOut). Half-open: existing.checkIn < new.checkOut
// AND existing.checkOut > new.checkIn.
function overlapWhere(checkIn: Date, checkOut: Date) {
  return { status: { notIn: RELEASED_STATES }, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } };
}

// ── Public read for the /b/[token] page (PII-minimized) ──────────────────────
export async function getBookingByViewToken(token: string) {
  if (!token) return null;
  return prisma.booking.findUnique({
    where: { viewToken: token },
    select: {
      confirmationCode: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      status: true,
      depositAmount: true,
      guest: { select: { fullName: true } },
      roomUnit: { select: { label: true, roomType: { select: { name: true } } } },
      diveAddons: { select: { participants: true, divePackage: { select: { name: true } } } },
    },
  });
}

export type PublicBooking = NonNullable<Awaited<ReturnType<typeof getBookingByViewToken>>>;

// ── Availability for a room type over a date range ───────────────────────────
// Returns null if the type doesn't exist; otherwise how many physical units are free.
export async function getAvailability(roomTypeSlug: string, checkIn: Date, checkOut: Date) {
  const roomType = await prisma.roomType.findUnique({
    where: { slug: roomTypeSlug },
    select: { id: true, name: true, basePricePerNight: true, maxGuests: true },
  });
  if (!roomType) return null;

  const freeUnits = await prisma.roomUnit.count({
    where: {
      roomTypeId: roomType.id,
      status: "ACTIVE",
      bookings: { none: overlapWhere(checkIn, checkOut) },
    },
  });
  return { roomType, freeUnits };
}

// ── Create a booking (server-authoritative) ──────────────────────────────────
// Guest books a room TYPE; the server validates, recomputes price, assigns a free
// UNIT, and inserts guest + booking + dive add-ons + audit event in a transaction.
// The DB EXCLUDE constraint is the final guard against double-booking under races.
export async function createBooking(raw: unknown): Promise<BookingActionResult> {
  const parsed = BookingInput.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }
  const input = parsed.data;

  if (input.checkIn < manilaToday()) {
    return { ok: false, message: "Check-in date can't be in the past.", errors: { checkIn: "Pick a future date." } };
  }

  const roomType = await prisma.roomType.findUnique({
    where: { slug: input.roomTypeSlug },
    select: { id: true, basePricePerNight: true, maxGuests: true },
  });
  if (!roomType) return { ok: false, message: "That room is not available." };
  if (input.guests > roomType.maxGuests) {
    return {
      ok: false,
      message: `That room holds up to ${roomType.maxGuests} guests.`,
      errors: { guests: "Too many guests for this room." },
    };
  }

  // Pricing — recomputed server-side; client totals are never trusted.
  const nights = Math.round((input.checkOut.getTime() - input.checkIn.getTime()) / DAY_MS);
  const roomSubtotal = nights * roomType.basePricePerNight;

  let diveSubtotal = 0;
  const diveAddonsData: { divePackageId: string; participants: number; preferredDate: Date | null; priceAtBooking: number }[] = [];
  if (input.diveAddons.length > 0) {
    const ids = input.diveAddons.map((a) => a.divePackageId);
    const packages = await prisma.divePackage.findMany({ where: { id: { in: ids } }, select: { id: true, price: true } });
    const priceById = new Map(packages.map((p) => [p.id, p.price]));
    for (const a of input.diveAddons) {
      const price = priceById.get(a.divePackageId);
      if (price === undefined) return { ok: false, message: "One of the selected diving packages is unavailable." };
      diveSubtotal += price * a.participants;
      diveAddonsData.push({
        divePackageId: a.divePackageId,
        participants: a.participants,
        preferredDate: a.preferredDate ?? null,
        priceAtBooking: price,
      });
    }
  }

  const totalPrice = roomSubtotal + diveSubtotal;
  const holdExpiresAt = new Date(Math.min(Date.now() + HOLD_WINDOW_MS, input.checkIn.getTime()));

  // Find free physical units of this type for the dates.
  const freeUnits = await prisma.roomUnit.findMany({
    where: {
      roomTypeId: roomType.id,
      status: "ACTIVE",
      bookings: { none: overlapWhere(input.checkIn, input.checkOut) },
    },
    select: { id: true },
    take: 5,
  });
  if (freeUnits.length === 0) {
    return { ok: false, message: "Sorry, that room type is fully booked for those dates." };
  }

  const guest = await prisma.guest.upsert({
    where: { email: input.email },
    update: { fullName: input.fullName, phone: input.phone },
    create: { fullName: input.fullName, email: input.email, phone: input.phone },
  });

  const confirmationCode = generateConfirmationCode();
  const viewToken = generateViewToken();

  // Try each candidate unit; the EXCLUDE constraint resolves concurrent races.
  for (const unit of freeUnits) {
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const created = await tx.booking.create({
          data: {
            roomUnitId: unit.id,
            guestId: guest.id,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            nights,
            roomSubtotal,
            diveSubtotal,
            totalPrice,
            depositAmount: DEPOSIT_AMOUNT,
            status: "PENDING_PAYMENT",
            confirmationCode,
            viewToken,
            specialRequests: input.specialRequests ?? null,
            holdExpiresAt,
            diveAddons: { create: diveAddonsData },
          },
          select: { id: true },
        });
        await tx.bookingEvent.create({
          data: { bookingId: created.id, toStatus: "PENDING_PAYMENT", actor: "guest" },
        });
        return created;
      });
      return { ok: true, bookingId: booking.id, confirmationCode, viewToken, depositAmount: DEPOSIT_AMOUNT };
    } catch (e) {
      if (isOverlapError(e)) continue; // this unit was just taken; try the next
      throw e;
    }
  }

  return { ok: false, message: "Sorry, that room type was just taken for those dates." };
}
