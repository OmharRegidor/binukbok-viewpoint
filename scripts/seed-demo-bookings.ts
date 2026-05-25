import { BookingStatus, PrismaClient } from "@prisma/client";
import { generateConfirmationCode } from "../lib/tokens";

// Seeds a realistic spread of bookings (varied statuses / dates / amounts) so the
// admin Bookings Management table, status filter, and pagination can be exercised.
// Re-runnable: clears its own demo guests first. Bookings are placed in "waves"
// 60 days apart per room unit, so they never collide with the no-double-booking
// EXCLUDE constraint. Safe on a dev database.
//
//   npx tsx scripts/seed-demo-bookings.ts          # seed
//   npx tsx scripts/seed-demo-bookings.ts --clean  # remove them again
const prisma = new PrismaClient();
const EMAIL_PREFIX = "demo.bk"; // demo.bk1@example.test, ...

type Seed = { name: string; phone: string; room: number; nights: number; offset: number; status: BookingStatus };

// offset = days from today (Manila). room = index into room_units. Same room only
// reused 60+ days apart → no date-range overlap.
const SEEDS: Seed[] = [
  // Past stays
  { name: "Ben Santos", phone: "0917 300 1001", room: 0, nights: 3, offset: -60, status: BookingStatus.COMPLETED },
  { name: "Rosa Lim", phone: "0917 300 1002", room: 1, nights: 2, offset: -60, status: BookingStatus.COMPLETED },
  { name: "Carlo Diaz", phone: "0917 300 1003", room: 2, nights: 4, offset: -60, status: BookingStatus.CANCELLED },
  { name: "Grace Yu", phone: "0917 300 1004", room: 3, nights: 5, offset: -60, status: BookingStatus.COMPLETED },
  // Arriving today
  { name: "Eleanor Shellstrop", phone: "0917 300 1005", room: 0, nights: 6, offset: 0, status: BookingStatus.CONFIRMED },
  { name: "Chidi Anagonye", phone: "0917 300 1006", room: 1, nights: 2, offset: 0, status: BookingStatus.CHECKED_IN },
  { name: "Tahani Al-Jamil", phone: "0917 300 1007", room: 2, nights: 4, offset: 0, status: BookingStatus.CONFIRMED },
  { name: "Jason Mendoza", phone: "0917 300 1008", room: 3, nights: 3, offset: 0, status: BookingStatus.CONFIRMED },
  // Upcoming + awaiting deposit
  { name: "Maria Santos", phone: "0917 300 1009", room: 0, nights: 2, offset: 60, status: BookingStatus.PENDING_PAYMENT },
  { name: "Jose Dela Cruz", phone: "0917 300 1010", room: 1, nights: 3, offset: 60, status: BookingStatus.PAYMENT_REVIEW },
  { name: "Anna Reyes", phone: "0917 300 1011", room: 2, nights: 5, offset: 60, status: BookingStatus.CONFIRMED },
  { name: "Michael Tan", phone: "0917 300 1012", room: 3, nights: 2, offset: 60, status: BookingStatus.PENDING_PAYMENT },
  // Further out
  { name: "Patricia Gomez", phone: "0917 300 1013", room: 0, nights: 4, offset: 120, status: BookingStatus.CONFIRMED },
  { name: "Daniel Cruz", phone: "0917 300 1014", room: 1, nights: 3, offset: 120, status: BookingStatus.PENDING_PAYMENT },
];

const DAY = 86_400_000;

function manilaTodayUTC(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${parts}T00:00:00.000Z`);
}

async function clean() {
  // Bookings first (FK), then guests — in one transaction so a mid-run failure
  // doesn't leave orphan guests.
  const [{ count }] = await prisma.$transaction([
    prisma.booking.deleteMany({ where: { guest: { email: { startsWith: EMAIL_PREFIX } } } }),
    prisma.guest.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } }),
  ]);
  console.log(`Removed ${count} demo booking(s) and their guests.`);
}

async function main() {
  const units = await prisma.roomUnit.findMany({ include: { roomType: true }, orderBy: { label: "asc" } });
  if (units.length < 4) throw new Error(`Need 4 room units — run \`pnpm db:seed\` first (found ${units.length}).`);

  await prisma.booking.deleteMany({ where: { guest: { email: { startsWith: EMAIL_PREFIX } } } });

  const today = manilaTodayUTC();
  let n = 0;
  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i];
    const unit = units[s.room % units.length];
    const email = `${EMAIL_PREFIX}${i + 1}@example.test`;

    const guest = await prisma.guest.upsert({
      where: { email },
      update: { fullName: s.name, phone: s.phone },
      create: { fullName: s.name, email, phone: s.phone },
    });

    const checkIn = new Date(today.getTime() + s.offset * DAY);
    const checkOut = new Date(checkIn.getTime() + s.nights * DAY);
    const subtotal = unit.roomType.basePricePerNight * s.nights;

    await prisma.booking.create({
      data: {
        roomUnitId: unit.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        nights: s.nights,
        roomSubtotal: subtotal,
        diveSubtotal: 0,
        totalPrice: subtotal,
        depositAmount: 500,
        status: s.status,
        checkedInAt: s.status === BookingStatus.CHECKED_IN ? new Date() : null,
        confirmationCode: generateConfirmationCode(),
      },
    });
    n++;
  }

  const [total, arrivals, pending] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] }, checkIn: { gte: today, lt: new Date(today.getTime() + DAY) } } }),
    prisma.booking.count({ where: { status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PAYMENT_REVIEW] } } }),
  ]);
  console.log(`Created ${n} demo bookings. Totals → all: ${total} · arrivals today: ${arrivals} · awaiting deposit: ${pending}`);
}

const run = process.argv.includes("--clean") ? clean : main;

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
