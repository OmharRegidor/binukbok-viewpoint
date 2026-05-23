import { BookingStatus } from "@prisma/client";
import { prisma } from "../prisma";

// Admin-side reads + mutations. These are auth-AGNOSTIC: the caller (a Clerk-gated
// Server Action) is responsible for verifying the admin before invoking them.
// `actorId` is recorded in the audit trail (booking_events.actor).

const DAY_MS = 24 * 60 * 60 * 1000;

function manilaToday(): Date {
  const m = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate()));
}

const LIST_SELECT = {
  id: true,
  confirmationCode: true,
  status: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  depositAmount: true,
  totalPrice: true,
  createdAt: true,
  guest: { select: { fullName: true, phone: true, email: true } },
  roomUnit: { select: { label: true, roomType: { select: { name: true } } } },
  diveAddons: { select: { participants: true, divePackage: { select: { name: true } } } },
} as const;

// Bookings awaiting deposit verification (oldest first).
export async function getPendingDeposits() {
  return prisma.booking.findMany({
    where: { status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PAYMENT_REVIEW] } },
    orderBy: { createdAt: "asc" },
    select: LIST_SELECT,
  });
}

// Guests due to arrive on a given day (default: today, Asia/Manila).
export async function getArrivals(date: Date = manilaToday()) {
  const next = new Date(date.getTime() + DAY_MS);
  return prisma.booking.findMany({
    where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] }, checkIn: { gte: date, lt: next } },
    orderBy: { checkIn: "asc" },
    select: LIST_SELECT,
  });
}

export type AdminActionResult = { ok: true } | { ok: false; message: string };

// Verify a deposit → CONFIRMED. Idempotent; only valid from a pending state.
export async function verifyDeposit(bookingId: string, actorId: string): Promise<AdminActionResult> {
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!b) return { ok: false, message: "Booking not found." };
  if (b.status === BookingStatus.CONFIRMED) return { ok: true }; // already done
  if (b.status !== BookingStatus.PENDING_PAYMENT && b.status !== BookingStatus.PAYMENT_REVIEW) {
    return { ok: false, message: `Can't confirm a ${b.status.toLowerCase()} booking.` };
  }
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CONFIRMED } });
    await tx.bookingEvent.create({
      data: { bookingId, fromStatus: b.status, toStatus: BookingStatus.CONFIRMED, actor: `admin:${actorId}` },
    });
  });
  return { ok: true };
}

// Mark a guest arrived → CHECKED_IN. Idempotent; only valid from CONFIRMED.
export async function markArrived(bookingId: string, actorId: string): Promise<AdminActionResult> {
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!b) return { ok: false, message: "Booking not found." };
  if (b.status === BookingStatus.CHECKED_IN) return { ok: true }; // already arrived
  if (b.status !== BookingStatus.CONFIRMED) {
    return { ok: false, message: `Only confirmed bookings can be checked in (this one is ${b.status.toLowerCase()}).` };
  }
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CHECKED_IN, checkedInAt: new Date() } });
    await tx.bookingEvent.create({
      data: { bookingId, fromStatus: BookingStatus.CONFIRMED, toStatus: BookingStatus.CHECKED_IN, actor: `admin:${actorId}` },
    });
  });
  return { ok: true };
}

// Scan path: look up by the QR's confirmation code, then check in.
export async function markArrivedByCode(code: string, actorId: string): Promise<AdminActionResult> {
  const b = await prisma.booking.findUnique({ where: { confirmationCode: code.trim() }, select: { id: true } });
  if (!b) return { ok: false, message: "No booking found for that code." };
  return markArrived(b.id, actorId);
}
