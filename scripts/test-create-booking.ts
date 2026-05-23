import { PrismaClient } from "@prisma/client";
import { createBooking, getAvailability } from "../lib/db/bookings";

// Exercises createBooking (book-by-type, auto unit assignment) + getAvailability
// against the live DB, then cleans up.
const prisma = new PrismaClient();
const EMAIL = "createbooking.test@example.test";

async function main() {
  const roomType = await prisma.roomType.findFirst({ select: { slug: true, maxGuests: true, _count: { select: { units: true } } } });
  if (!roomType) throw new Error("No room types — run `pnpm db:seed` first.");
  const dive = await prisma.divePackage.findFirst();

  await prisma.booking.deleteMany({ where: { guest: { email: EMAIL } } });

  const base = {
    fullName: "Create Test",
    email: EMAIL,
    phone: "0917 111 2222",
    roomTypeSlug: roomType.slug,
    checkIn: "2099-07-10",
    checkOut: "2099-07-13",
    guests: 1,
    specialRequests: "Late check-in please",
    diveAddons: dive ? [{ divePackageId: dive.id, participants: 2 }] : [],
  };

  let pass = 0;
  let fail = 0;
  const check = (ok: boolean, label: string) => {
    console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${label}`);
    ok ? pass++ : fail++;
  };

  const before = await getAvailability(roomType.slug, new Date("2099-07-10"), new Date("2099-07-13"));
  check(!!before && before.freeUnits === roomType._count.units, `availability before = all ${roomType._count.units} unit(s) free`);

  const r1 = await createBooking(base);
  check(r1.ok === true && !!(r1 as { viewToken?: string }).viewToken, "valid booking created, returns viewToken");

  const after = await getAvailability(roomType.slug, new Date("2099-07-10"), new Date("2099-07-13"));
  check(!!after && after.freeUnits === roomType._count.units - 1, "availability dropped by 1 after booking");

  // Re-book same type+dates until units run out → eventually "fully booked".
  let exhausted = false;
  for (let i = 0; i < roomType._count.units + 1; i++) {
    const r = await createBooking({ ...base, email: `t${i}.${EMAIL}` });
    if (!r.ok) { exhausted = true; break; }
  }
  check(exhausted, "fully-booked rejected once all units of the type are taken");

  const r3 = await createBooking({ ...base, checkIn: "2099-09-01", checkOut: "2099-09-03", guests: roomType.maxGuests + 1 });
  check(r3.ok === false, `over-capacity rejected (> ${roomType.maxGuests} guests)`);

  const r4 = await createBooking({ ...base, checkIn: "2000-01-01", checkOut: "2000-01-02" });
  check(r4.ok === false, "past check-in rejected");

  const r5 = await createBooking({ ...base, email: "not-an-email", checkIn: "2099-10-01", checkOut: "2099-10-02" });
  check(r5.ok === false, "invalid email rejected by Zod");

  // Cleanup every guest this test created.
  await prisma.booking.deleteMany({ where: { guest: { email: { contains: "createbooking.test@example.test" } } } });

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
