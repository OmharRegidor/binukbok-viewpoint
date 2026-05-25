import { PrismaClient, type BookingStatus } from "@prisma/client";
import { generateConfirmationCode, generateViewToken } from "../lib/tokens";
import { checkInByCode, getArrivals, getPendingDeposits, markArrived, verifyDeposit } from "../lib/db/admin";

const prisma = new PrismaClient();
const EMAIL = "admin.test@example.test";
const ACTOR = "test-admin";

async function makeBooking(status: BookingStatus, month: number, day: number, code?: string) {
  const unit = await prisma.roomUnit.findFirst({ include: { roomType: true } });
  if (!unit) throw new Error("No room units — run `pnpm db:seed` first.");
  const guest = await prisma.guest.upsert({
    where: { email: EMAIL },
    update: {},
    create: { fullName: "Admin Test", email: EMAIL, phone: "0917 000 0000" },
  });
  const checkIn = new Date(Date.UTC(2099, month, day));
  const checkOut = new Date(Date.UTC(2099, month, day + 2));
  const subtotal = unit.roomType.basePricePerNight * 2;
  return prisma.booking.create({
    data: {
      roomUnitId: unit.id, guestId: guest.id, checkIn, checkOut, nights: 2,
      roomSubtotal: subtotal, diveSubtotal: 0, totalPrice: subtotal, depositAmount: 500,
      status, confirmationCode: code ?? generateConfirmationCode(), viewToken: generateViewToken(),
    },
  });
}

async function main() {
  await prisma.booking.deleteMany({ where: { guest: { email: EMAIL } } });
  let pass = 0;
  let fail = 0;
  const check = (ok: boolean, label: string) => { console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${label}`); ok ? pass++ : fail++; };

  // verifyDeposit: pending → CONFIRMED (distinct dates per booking to avoid the EXCLUDE constraint)
  const b1 = await makeBooking("PENDING_PAYMENT", 6, 10);
  const r1 = await verifyDeposit(b1.id, ACTOR);
  const s1 = await prisma.booking.findUnique({ where: { id: b1.id }, select: { status: true } });
  check(r1.ok && s1?.status === "CONFIRMED", "verifyDeposit: pending → CONFIRMED");

  const r1b = await verifyDeposit(b1.id, ACTOR);
  check(r1b.ok, "verifyDeposit idempotent when already confirmed");

  const r2 = await markArrived(b1.id, ACTOR);
  const s2 = await prisma.booking.findUnique({ where: { id: b1.id }, select: { status: true, checkedInAt: true } });
  check(r2.ok && s2?.status === "CHECKED_IN" && !!s2?.checkedInAt, "markArrived: confirmed → CHECKED_IN (timestamp set)");

  const r2b = await markArrived(b1.id, ACTOR);
  check(r2b.ok, "markArrived idempotent when already arrived");

  const b2 = await makeBooking("PENDING_PAYMENT", 7, 10);
  const r3 = await markArrived(b2.id, ACTOR);
  check(!r3.ok, "markArrived rejected on a non-confirmed booking");

  const code = "BVP-ADMIN1";
  const b3 = await makeBooking("CONFIRMED", 8, 10, code);
  const r4 = await checkInByCode(code, ACTOR);
  const s4 = await prisma.booking.findUnique({ where: { id: b3.id }, select: { status: true } });
  check(r4.ok && !r4.alreadyArrived && s4?.status === "CHECKED_IN", "checkInByCode: scan → CHECKED_IN");

  const r4b = await checkInByCode(code, ACTOR);
  check(r4b.ok && r4b.alreadyArrived, "checkInByCode idempotent → alreadyArrived on re-scan");

  const b3b = await makeBooking("CANCELLED", 9, 10, "BVP-CANCEL");
  const r4c = await checkInByCode("BVP-CANCEL", ACTOR);
  check(!r4c.ok, "checkInByCode rejects a cancelled booking with a reason");
  void b3b;

  const pend = await getPendingDeposits();
  check(pend.some((p) => p.id === b2.id), "getPendingDeposits lists pending bookings");

  const arrivals = await getArrivals(new Date(Date.UTC(2099, 6, 10)));
  check(arrivals.some((a) => a.id === b1.id), "getArrivals lists arrivals for a given day");

  const events = await prisma.bookingEvent.findMany({ where: { bookingId: b1.id } });
  check(
    events.some((e) => e.toStatus === "CONFIRMED" && e.actor === `admin:${ACTOR}`) &&
      events.some((e) => e.toStatus === "CHECKED_IN"),
    "audit events recorded with admin actor",
  );

  await prisma.booking.deleteMany({ where: { guest: { email: EMAIL } } });
  console.log(`\n${fail === 0 ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"} (${pass} passed, ${fail} failed)`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
