import { PrismaClient } from "@prisma/client";
import { generateConfirmationCode, generateViewToken } from "../lib/tokens";

// Creates a CONFIRMED demo booking so the public /b/[token] page can be viewed.
// Re-runnable: clears any previous demo booking first. Safe on a dev database.
const prisma = new PrismaClient();
const DEMO_EMAIL = "demo.guest@example.test";

async function main() {
  const unit = await prisma.roomUnit.findFirst({ include: { roomType: true } });
  if (!unit) throw new Error("No room units found — run `pnpm db:seed` first.");

  // Clean up previous demo bookings so the date range is free for the EXCLUDE constraint.
  await prisma.booking.deleteMany({ where: { guest: { email: DEMO_EMAIL } } });

  const guest = await prisma.guest.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { fullName: "Demo Guest", email: DEMO_EMAIL, phone: "0917 000 0000" },
  });

  const viewToken = generateViewToken();
  const checkIn = new Date(Date.UTC(2099, 5, 10));
  const checkOut = new Date(Date.UTC(2099, 5, 12));
  const nights = 2;
  const subtotal = unit.roomType.basePricePerNight * nights;

  const booking = await prisma.booking.create({
    data: {
      roomUnitId: unit.id,
      guestId: guest.id,
      checkIn,
      checkOut,
      nights,
      roomSubtotal: subtotal,
      diveSubtotal: 0,
      totalPrice: subtotal,
      depositAmount: 500,
      status: "CONFIRMED",
      confirmationCode: generateConfirmationCode(),
      viewToken,
    },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  console.log("Demo booking created:");
  console.log("  room            :", `${unit.roomType.name} (${unit.label})`);
  console.log("  confirmationCode:", booking.confirmationCode);
  console.log("  VIEW URL        :", `${base}/b/${viewToken}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
