import { prisma } from "../prisma";

// Catalog reads for the booking form. These replace the hardcoded lib/data.ts
// arrays as the source for the room-type and dive-course dropdowns.

export async function getRoomTypes() {
  return prisma.roomType.findMany({
    orderBy: { basePricePerNight: "asc" },
    select: { slug: true, name: true, basePricePerNight: true, maxGuests: true },
  });
}
export type RoomTypeOption = Awaited<ReturnType<typeof getRoomTypes>>[number];

export async function getDivePackages() {
  return prisma.divePackage.findMany({
    orderBy: { price: "asc" },
    select: { id: true, slug: true, name: true, price: true, unit: true },
  });
}
export type DiveOption = Awaited<ReturnType<typeof getDivePackages>>[number];
