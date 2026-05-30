import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";
import { getDivePackages, getRoomTypes } from "@/lib/db/catalog";

export const metadata: Metadata = {
  title: "Book Your Stay | BiNuKBoK VieW PoiNT ReSoRT",
  description: "Reserve your room and diving experience at BiNuKBoK VieW PoiNT ReSoRT.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ dive?: string }>;
}) {
  const [{ dive }, roomTypes, divePackages] = await Promise.all([
    searchParams,
    getRoomTypes(),
    getDivePackages(),
  ]);

  // "/book?dive=open-water-certification" pre-selects that course.
  const initialDivePackageId = dive ? divePackages.find((d) => d.slug === dive)?.id : undefined;

  return (
    <>
      <section className="bg-gradient-to-b from-navy to-teal-deep py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Reservations
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Book Your Stay</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/80">
            Reserve your room and diving experience at BiNuKBoK VieW PoiNT ReSoRT
          </p>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <BookingForm
            roomTypes={roomTypes}
            divePackages={divePackages}
            initialDivePackageId={initialDivePackageId}
          />
        </div>
      </section>
    </>
  );
}
