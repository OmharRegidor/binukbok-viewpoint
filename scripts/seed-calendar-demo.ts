import { BookingStatus, PrismaClient } from "@prisma/client";
import { generateConfirmationCode } from "../lib/tokens";

// Seeds a varied spread of bookings WITHIN the current month so the admin
// Availability Calendar shows every cell state: past (dimmed) stays, a partial
// "N free" day today with arrivals + a departure, an open day, and a "Full" block.
// Isolated by its own email prefix and fully reversible.
//
//   npx tsx scripts/seed-calendar-demo.ts          # seed
//   npx tsx scripts/seed-calendar-demo.ts --clean  # remove them again
const prisma = new PrismaClient();
const EMAIL_PREFIX = "demo.cal"; // demo.cal1@example.test, ... (separate from demo.bk*)

type Seed = { name: string; phone: string; room: number; offset: number; nights: number; status: BookingStatus };

// offset = days from today (Manila). room = index into room_units (0-3). Each unit's
// stays are spaced so they never overlap → safe under the no-double-booking constraint.
const SEEDS: Seed[] = [
  // ── Past, in-month (render dimmed) ──
  { name: "Liza Macapagal", phone: "0917 400 2001", room: 0, offset: -12, nights: 3, status: BookingStatus.COMPLETED },
  { name: "Pedro Penduko", phone: "0917 400 2002", room: 1, offset: -8, nights: 2, status: BookingStatus.COMPLETED },
  { name: "Cancelled Carla", phone: "0917 400 2003", room: 2, offset: -6, nights: 4, status: BookingStatus.CANCELLED }, // released → must NOT show as booked
  // ── Departure today (checks out this morning) ──
  { name: "Nora Aquino", phone: "0917 400 2004", room: 0, offset: -2, nights: 2, status: BookingStatus.CHECKED_IN },
  // ── Arrivals today (confirmed → also appear in Pending Check-ins) ──
  { name: "Eleanor Shellstrop", phone: "0917 400 2005", room: 1, offset: 0, nights: 3, status: BookingStatus.CONFIRMED },
  { name: "Tahani Al-Jamil", phone: "0917 400 2006", room: 2, offset: 0, nights: 2, status: BookingStatus.CONFIRMED },
  // ── In-house, spanning today (arrived yesterday) ──
  { name: "Chidi Anagonye", phone: "0917 400 2007", room: 3, offset: -1, nights: 4, status: BookingStatus.CHECKED_IN },
  // ── A fully-booked block a few days out (all four units overlap) ──
  { name: "Maria Clara", phone: "0917 400 2008", room: 0, offset: 4, nights: 3, status: BookingStatus.CONFIRMED },
  { name: "Crisostomo Ibarra", phone: "0917 400 2009", room: 1, offset: 4, nights: 3, status: BookingStatus.PENDING_PAYMENT }, // held → counts as booked, not an arrival
  { name: "Sisa Dimasalang", phone: "0917 400 2010", room: 2, offset: 4, nights: 3, status: BookingStatus.CONFIRMED },
  { name: "Elias Bantug", phone: "0917 400 2011", room: 3, offset: 4, nights: 3, status: BookingStatus.CONFIRMED },
];

const DAY = 86_400_000;

function manilaTodayUTC(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(`${parts}T00:00:00.000Z`);
}

async function clean() {
  const [{ count }] = await prisma.$transaction([
    prisma.booking.deleteMany({ where: { guest: { email: { startsWith: EMAIL_PREFIX } } } }),
    prisma.guest.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } }),
  ]);
  console.log(`Removed ${count} calendar-demo booking(s) and their guests.`);
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

  console.log(`Created ${n} calendar-demo bookings for the current month.`);
  console.log("Clean up anytime with:  npx tsx scripts/seed-calendar-demo.ts --clean");
}

const run = process.argv.includes("--clean") ? clean : main;

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
