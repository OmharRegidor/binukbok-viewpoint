import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Catalog seed data, mirrored from lib/data.ts.
// `units` = how many PHYSICAL rooms exist of this type. Default 1 each —
// change these numbers to the resort's real counts, then re-run the seed.
const roomTypes = [
  {
    slug: "couple-room",
    name: "Couple Room",
    tagline: "Romantic Escape",
    badge: "Perfect for couples",
    basePricePerNight: 1500,
    maxGuests: 2,
    description:
      "Experience unparalleled sunset views in our cozy couple room. Perfect for honeymoons, anniversaries, or a romantic weekend getaway.",
    features: ["Double Bed", "Private Bathroom", "Electric Fan", "Sea View"],
    units: 1,
  },
  {
    slug: "family-room",
    name: "Family Room",
    tagline: "Space for Everyone",
    badge: "Best for families",
    basePricePerNight: 2500,
    maxGuests: 6,
    description:
      "Spacious accommodation with bunk beds, ideal for families or groups. Create lasting memories together with your loved ones.",
    features: ["Bunk Beds", "Private Bathroom", "Electric Fan", "Spacious"],
    units: 1,
  },
  {
    slug: "kubo-room",
    name: "Kubo Room",
    tagline: "Traditional Filipino",
    badge: "Cultural experience",
    basePricePerNight: 1800,
    maxGuests: 4,
    description:
      "Experience authentic Filipino living in our traditional bamboo kubo. A unique cultural stay with modern comforts.",
    features: ["Traditional Design", "Queen Bed", "Electric Fan", "Native Ambiance"],
    units: 1,
  },
  {
    slug: "camping-tent",
    name: "Camping Tent",
    tagline: "Adventure Awaits",
    badge: "Budget friendly",
    basePricePerNight: 800,
    maxGuests: 3,
    description:
      "Sleep under the stars by the beach. Our camping setup provides the perfect adventure experience with comfort.",
    features: ["Quality Tent", "Foam Mattress"],
    units: 1,
  },
];

const divePackages = [
  { slug: "discovery-dive", name: "Discovery Dive", tagline: "Try Scuba Experience", price: 3500, unit: "Half Day", popular: true },
  { slug: "open-water-certification", name: "Open Water Certification", tagline: "PADI Open Water Diver", price: 18000, unit: "3-4 Days", popular: false },
  { slug: "freediving-course", name: "Freediving Course", tagline: "Breath-Hold Diving", price: 8000, unit: "2 Days", popular: false },
  { slug: "fun-dive", name: "Fun Dive", tagline: "For Certified Divers", price: 2500, unit: "Per Dive", popular: false },
];

async function main() {
  for (const { units, ...data } of roomTypes) {
    const roomType = await prisma.roomType.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });

    // Idempotent: only create units up to the desired count.
    const existing = await prisma.roomUnit.count({ where: { roomTypeId: roomType.id } });
    for (let i = existing; i < units; i++) {
      await prisma.roomUnit.create({
        data: { roomTypeId: roomType.id, label: `${data.name} ${i + 1}` },
      });
    }
  }

  for (const dp of divePackages) {
    await prisma.divePackage.upsert({ where: { slug: dp.slug }, update: dp, create: dp });
  }

  console.log("Seed complete:");
  console.log("  room_types   :", await prisma.roomType.count());
  console.log("  room_units   :", await prisma.roomUnit.count());
  console.log("  dive_packages:", await prisma.divePackage.count());
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
