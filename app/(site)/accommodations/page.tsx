import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { rooms } from "@/lib/data";
import { Users, Check, ArrowRight, Sun, Bath, Fan } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Accommodations | BiNuKBoK VieW PoiNT ReSoRT",
  description:
    "From romantic couple rooms to traditional kubos, discover your ideal beachfront accommodation.",
};

const amenities = [
  { title: "Beachfront Access", text: "Private beach area", Icon: Sun },
  { title: "Common Area", text: "Shared lounge space", Icon: Users },
  { title: "Shared Bathroom", text: "Clean facilities", Icon: Bath },
  { title: "Ventilation", text: "Electric fans provided", Icon: Fan },
];

export default function AccommodationsPage() {
  return (
    <>
      {/* hero */}
      <section className="bg-gradient-to-b from-navy to-teal-deep py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Accommodations
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
            Find Your Perfect Stay
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/80">
            From romantic couple rooms to traditional kubos, discover your ideal
            beachfront accommodation
          </p>
        </div>
      </section>

      {/* alternating room rows */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl space-y-20 px-6 lg:px-8">
          {rooms.map((room, i) => {
            const imageFirst = i % 2 === 0;
            const Visual = (
              <div className="relative mx-auto aspect-[4/3] w-full max-w-[512px] overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
                <Image
                  src={`/images/${room.slug}.png`}
                  alt={`${room.name} at BiNuKBoK VieW PoiNT ReSoRT`}
                  fill
                  sizes="(max-width: 512px) 100vw, 512px"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy shadow ring-1 ring-black/5">
                  {room.badge}
                </span>
              </div>
            );
            const Text = (
              <div>
                <p className="text-sm font-semibold text-teal">{room.tagline}</p>
                <h2 className="mb-4 mt-1 text-3xl font-bold text-navy md:text-4xl">{room.name}</h2>
                <p className="mb-6 text-lg leading-relaxed text-gray-600">
                  {room.description}
                </p>
                <p className="flex items-center gap-2 text-base text-gray-700">
                  <Users className="h-5 w-5 text-teal" />
                  {room.guests}
                </p>
                <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                  {room.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/book"
                  className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-coral px-8 text-sm font-medium text-white transition-colors hover:bg-coral-dark"
                >
                  Book This Room <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );

            return (
              <div
                key={room.slug}
                className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
              >
                {imageFirst ? (
                  <>
                    {Visual}
                    {Text}
                  </>
                ) : (
                  <>
                    <div className="order-2 lg:order-1">{Text}</div>
                    <div className="order-1 lg:order-2">{Visual}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* amenities */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-extrabold text-navy sm:text-4xl">Resort Amenities</h2>
          <p className="mt-2 text-base text-navy/60">
            All guests enjoy access to our resort facilities
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {amenities.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal-deep">
                  <a.Icon className="h-6 w-6" />
                </span>
                <p className="font-bold text-navy">{a.title}</p>
                <p className="mt-1 text-sm text-navy/55">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold">Ready to Book Your Stay?</h2>
          <p className="mt-3 text-sm text-white/70">
            Secure your perfect accommodation at BiNuKBoK VieW PoiNT ReSoRT
          </p>
          <Link
            href="/book"
            className="mt-7 inline-block rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
          >
            Book Now
          </Link>
        </div>
      </section>
    </>
  );
}
