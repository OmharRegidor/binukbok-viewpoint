import Link from "next/link";
import type { Metadata } from "next";
import { RoomImageCard } from "@/components/RoomImageCard";
import { rooms } from "@/lib/data";
import { Users, Check, ArrowRight, Star } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Accommodations | Binukbok View Point Resort",
  description:
    "From romantic couple rooms to traditional kubos, discover your ideal beachfront accommodation.",
};

const amenities = [
  { title: "Beachfront Access", text: "Private beach area" },
  { title: "Common Area", text: "Shared lounge space" },
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
              <div className="relative">
                <span className="absolute -top-3 left-4 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-navy shadow ring-1 ring-black/5">
                  {room.badge}
                </span>
                <RoomImageCard room={room} />
              </div>
            );
            const Text = (
              <div>
                <p className="text-sm font-semibold text-teal">{room.tagline}</p>
                <h2 className="mt-1 text-3xl font-extrabold text-navy">{room.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-navy/70">
                  {room.description}
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-navy/80">
                  <Users className="h-4 w-4 text-teal" />
                  {room.guests}
                </p>
                <ul className="mt-4 grid grid-cols-2 gap-y-2.5 gap-x-4">
                  {room.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-navy/70">
                      <Check className="h-4 w-4 text-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/book"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
                >
                  Book This Room <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );

            return (
              <div
                key={room.slug}
                className="grid items-center gap-10 lg:grid-cols-2"
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
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-navy">Resort Amenities</h2>
          <p className="mt-2 text-sm text-navy/60">
            All guests enjoy access to our resort facilities
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {amenities.map((a) => (
              <div
                key={a.title}
                className="rounded-xl bg-white/70 p-8 text-center shadow-sm"
              >
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
                  <Star className="h-6 w-6" />
                </span>
                <p className="font-semibold text-navy">{a.title}</p>
                <p className="mt-1 text-xs text-navy/60">{a.text}</p>
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
            Secure your perfect accommodation at Binukbok View Point Resort
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
