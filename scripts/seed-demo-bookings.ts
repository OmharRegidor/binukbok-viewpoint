import { PrismaClient } from "@prisma/client";
import { generateConfirmationCode } from "../lib/tokens";

// Creates a couple of PENDING_PAYMENT bookings so the admin "Awaiting deposit"
// list (and the Confirm action) can be exercised. Re-runnable: clears its own
// demo guests first. Distinct room units → no clash with the no-double-booking
// EXCLUDE constraint. Safe on a dev database.
//
//   npx tsx scripts/seed-demo-bookings.ts          # seed demo bookings
//   npx tsx scripts/seed-demo-bookings.ts --clean  # remove them again
const prisma = new PrismaClient();
const EMAIL_PREFIX = "demo.pending"; // demo.pending1@example.test, ...

const DEMO = [
  { fullName: "Maria Santos", phone: "0917 111 2222", nights: 2, checkIn: [2099, 7, 1] as const },
  { fullName: "Jose Dela Cruz", phone: "0918 333 4444", nights: 3, checkIn: [2099, 8, 5] as const },
];

// Remove the demo bookings (and their guests). Booking events/dive add-ons
// cascade on delete; the demo bookings carry no payments.
async function clean() {
  const { count } = await prisma.booking.deleteMany({ where: { guest: { email: { startsWith: EMAIL_PREFIX } } } });
  await prisma.guest.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } });
  console.log(`Removed ${count} demo booking(s) and their guests.`);
}

async function main() {
  const units = await prisma.roomUnit.findMany({ include: { roomType: true } });
  if (units.length < DEMO.length) {
    throw new Error(`Need ${DEMO.length} room units — run \`pnpm db:seed\` first (found ${units.length}).`);
  }

  await prisma.booking.deleteMany({ where: { guest: { email: { startsWith: EMAIL_PREFIX } } } });

  console.log("Created PENDING_PAYMENT bookings:");
  for (let i = 0; i < DEMO.length; i++) {
    const d = DEMO[i];
    const unit = units[i];
    const email = `${EMAIL_PREFIX}${i + 1}@example.test`;

    const guest = await prisma.guest.upsert({
      where: { email },
      update: { fullName: d.fullName, phone: d.phone },
      create: { fullName: d.fullName, email, phone: d.phone },
    });

    const [y, m, day] = d.checkIn;
    const checkIn = new Date(Date.UTC(y, m, day));
    const checkOut = new Date(Date.UTC(y, m, day + d.nights));
    const subtotal = unit.roomType.basePricePerNight * d.nights;

    const b = await prisma.booking.create({
      data: {
        roomUnitId: unit.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        nights: d.nights,
        roomSubtotal: subtotal,
        diveSubtotal: 0,
        totalPrice: subtotal,
        depositAmount: 500,
        status: "PENDING_PAYMENT",
        confirmationCode: generateConfirmationCode(),
      },
    });

    console.log(`  ${d.fullName.padEnd(16)} ${unit.roomType.name} (${unit.label})  ${b.confirmationCode}  ₱${subtotal.toLocaleString()}`);
  }

  console.log("Awaiting deposit now:", await prisma.booking.count({ where: { status: "PENDING_PAYMENT" } }));
}

const run = process.argv.includes("--clean") ? clean : main;

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
