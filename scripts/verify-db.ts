import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

// Behavioral check that the no-double-booking EXCLUDE constraint actually works.
// Uses far-future dates and cleans up after itself, so it's safe to re-run.
const prisma = new PrismaClient();

const isOverlapError = (e: unknown) =>
  /no_overlap|exclusion|23P01|conflicting key value/i.test(String((e as Error)?.message ?? e));

function booking(roomUnitId: string, guestId: string, checkIn: string, checkOut: string) {
  return {
    roomUnitId,
    guestId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    nights: 2,
    roomSubtotal: 3000,
    diveSubtotal: 0,
    totalPrice: 3000,
    depositAmount: 500,
    confirmationCode: randomUUID(),
  };
}

async function main() {
  const unit = await prisma.roomUnit.findFirst();
  if (!unit) throw new Error("No room_units found — run `pnpm db:seed` first.");

  const guest = await prisma.guest.create({
    data: { fullName: "TEST Verify", email: `verify-${randomUUID()}@example.test`, phone: "0000000000" },
  });

  const createdIds: string[] = [];
  let pass = 0;
  let fail = 0;
  const check = (ok: boolean, label: string) => {
    console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${label}`);
    ok ? pass++ : fail++;
  };

  try {
    // 1) First booking should succeed.
    const a = await prisma.booking.create({ data: booking(unit.id, guest.id, "2099-01-10", "2099-01-12") });
    createdIds.push(a.id);
    check(true, "first booking created (Jan 10–12)");

    // 2) Overlapping booking on the SAME unit must be rejected.
    try {
      const b = await prisma.booking.create({ data: booking(unit.id, guest.id, "2099-01-11", "2099-01-13") });
      createdIds.push(b.id);
      check(false, "overlapping booking (Jan 11–13) was WRONGLY allowed");
    } catch (e) {
      check(isOverlapError(e), "overlapping booking (Jan 11–13) correctly rejected by EXCLUDE constraint");
    }

    // 3) Adjacent booking (checkout day == next check-in day) must be allowed (half-open range).
    const c = await prisma.booking.create({ data: booking(unit.id, guest.id, "2099-01-12", "2099-01-14") });
    createdIds.push(c.id);
    check(true, "adjacent booking (Jan 12–14) allowed — half-open range works");
  } finally {
    // Cleanup
    await prisma.booking.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.guest.delete({ where: { id: guest.id } });
  }

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
