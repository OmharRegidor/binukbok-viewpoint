import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { DAY_MS, manilaToday } from "./dates";

// Admin-side reads + mutations. These are auth-AGNOSTIC: the caller (a Clerk-gated
// Server Action) is responsible for verifying the admin before invoking them.
// `actorId` is recorded in the audit trail (booking_events.actor).

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

// Shared OR-clause for booking search: guest name/email/phone, confirmation code,
// and room unit label (room #). Reused by searchBookings + listBookings.
function buildSearchOr(term: string): Prisma.BookingWhereInput["OR"] {
  return [
    { confirmationCode: { contains: term, mode: "insensitive" } },
    { guest: { fullName: { contains: term, mode: "insensitive" } } },
    { guest: { email: { contains: term, mode: "insensitive" } } },
    { guest: { phone: { contains: term } } },
    { roomUnit: { label: { contains: term, mode: "insensitive" } } },
  ];
}

// Find a booking by guest name, confirmation code, phone, email, or room label.
export async function searchBookings(q: string) {
  const term = q.trim();
  if (term.length < 2) return [];
  return prisma.booking.findMany({
    where: { OR: buildSearchOr(term) },
    orderBy: { checkIn: "desc" },
    take: 25,
    select: LIST_SELECT,
  });
}

// Check out a guest → COMPLETED. Idempotent; only valid from CHECKED_IN.
export async function markCompleted(bookingId: string, actorId: string): Promise<AdminActionResult> {
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!b) return { ok: false, message: "Booking not found." };
  if (b.status === BookingStatus.COMPLETED) return { ok: true };
  if (b.status !== BookingStatus.CHECKED_IN) {
    return { ok: false, message: `Only checked-in guests can be checked out (this one is ${b.status.toLowerCase()}).` };
  }
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.COMPLETED } });
    await tx.bookingEvent.create({
      data: { bookingId, fromStatus: BookingStatus.CHECKED_IN, toStatus: BookingStatus.COMPLETED, actor: `admin:${actorId}` },
    });
  });
  return { ok: true };
}

// At-a-glance counts for the Today KPI strip.
export async function getDashboardCounts() {
  const today = manilaToday();
  const next = new Date(today.getTime() + DAY_MS);
  const [arrivalsToday, awaitingDeposit, inHouse] = await Promise.all([
    prisma.booking.count({ where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] }, checkIn: { gte: today, lt: next } } }),
    prisma.booking.count({ where: { status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PAYMENT_REVIEW] } } }),
    prisma.booking.count({ where: { status: BookingStatus.CHECKED_IN } }),
  ]);
  return { arrivalsToday, awaitingDeposit, inHouse };
}

// Paginated, filterable list of all bookings for the admin Bookings table.
// `from`/`to` are UTC-midnight Dates standing for Manila calendar dates (build them
// like manilaToday() does); `to` is treated as inclusive. Returns the page rows plus
// the total count (for "Showing X of N"). count + page fetch run in one transaction
// so the total is consistent with the rows.
export type ListBookingsOpts = {
  q?: string;
  status?: BookingStatus | "ALL";
  from?: Date;
  to?: Date;
  skip?: number;
  take?: number;
};

const MAX_TAKE = 100; // never pull unbounded rows for a UI table

export async function listBookings(opts: ListBookingsOpts = {}) {
  const { q, status, from, to, skip = 0 } = opts;
  const take = Math.min(Math.max(opts.take ?? 10, 1), MAX_TAKE);

  const where: Prisma.BookingWhereInput = {};

  const term = q?.trim() ?? "";
  if (term.length >= 2) where.OR = buildSearchOr(term);

  if (status && status !== "ALL") where.status = status;

  if (from || to) {
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = from;
    if (to) range.lt = new Date(to.getTime() + DAY_MS); // inclusive upper bound
    where.checkIn = range;
  }

  const [total, rows] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({ where, orderBy: { checkIn: "desc" }, skip, take, select: LIST_SELECT }),
  ]);

  return { rows, total };
}
