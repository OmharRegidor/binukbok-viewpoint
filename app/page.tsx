import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { RoomImageCard } from "@/components/RoomImageCard";
import { rooms, testimonials, stats, contact } from "@/lib/data";
import {
  Award,
  Users,
  Clock,
  Shield,
  ArrowRight,
  ChevronDown,
  Waves,
  StarFilled,
  Quote,
  MapPin,
  Phone,
} from "@/components/Icons";

const featuredPoints = [
  { icon: Award, title: "PADI Certified", text: "Professional diving certifications" },
  { icon: Users, title: "Expert Instructors", text: "Hands-on training for all levels" },
  { icon: Clock, title: "Flexible Programs", text: "From beginners to advanced" },
  { icon: Shield, title: "Safety First", text: "Top-quality equipment provided" },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero-poster relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* darkening overlay: deepens the backdrop and lifts text contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/40" />

        {/* hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
          <Logo size={120} className="mx-auto mb-5 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] md:text-6xl lg:text-7xl">
            BiNuKBoK
          </h1>
          <p className="text-gradient-teal text-4xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] md:text-6xl lg:text-7xl">
            VieW PoiNT ReSoRT
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-white drop-shadow-[0_1px_10px_rgba(0,0,0,0.6)] sm:text-lg">
            Discover paradise in Bauan, Batangas. Experience breathtaking sunsets,
            world-class diving, and authentic Filipino hospitality.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/book"
              className="inline-flex h-12 items-center justify-center rounded-full bg-coral px-8 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-coral-dark"
            >
              Book Your Stay
            </Link>
            <Link
              href="/diving"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-lg font-semibold text-navy shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Waves className="h-5 w-5 text-teal" />
              Explore Diving
            </Link>
          </div>

          {/* scroll-down indicator — kept in flow so it never overlaps the buttons */}
          <a
            href="#featured-experience"
            aria-label="Scroll to featured experience"
            className="mt-10 inline-flex"
          >
            <ChevronDown className="h-7 w-7 animate-bounce text-white/90 drop-shadow" />
          </a>
        </div>

        {/* single translucent wave that gently undulates along the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5]">
          <svg
            className="hero-wave"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#f3ead3" fillOpacity="0.3">
              <animate
                attributeName="d"
                dur="8s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.5;1"
                keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                values="M0,64 C320,112 520,16 760,64 C1040,120 1200,24 1440,64 L1440,120 L0,120 Z;
                        M0,64 C320,16 520,112 760,64 C1040,24 1200,120 1440,64 L1440,120 L0,120 Z;
                        M0,64 C320,112 520,16 760,64 C1040,120 1200,24 1440,64 L1440,120 L0,120 Z"
              />
            </path>
          </svg>
        </div>
      </section>

      {/* ---------------- SCUBA FEATURED ---------------- */}
      <section
        id="featured-experience"
        className="relative flex min-h-screen scroll-mt-16 items-center overflow-hidden bg-cream py-20"
      >
        {/* soft decorative circles */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-teal/5" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-teal/10" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
          {/* left visual: scuba poster + BIDA badge sticking out */}
          <div className="relative mx-auto w-full max-w-[584px]">
            <Image
              src="/images/scuba-diving.png"
              alt="Scuba diving at BIDA — BiNuKBoK Dive Academy"
              width={584}
              height={584}
              className="w-full rounded-3xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-4 flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-deep text-white">
                <Award className="h-7 w-7" />
              </span>
              <div className="leading-tight">
                <p className="text-2xl font-extrabold text-navy">BIDA</p>
                <p className="whitespace-nowrap text-sm text-navy/60">Dive Academy</p>
              </div>
            </div>
          </div>

          {/* right text */}
          <div>
            <span className="mb-6 inline-block rounded-full bg-teal/10 px-4 py-1.5 text-sm font-semibold text-teal-deep">
              Featured Experience
            </span>
            <h2 className="mb-6 text-3xl font-bold leading-tight text-navy md:text-5xl">
              Get Your Scuba <span className="text-teal-deep">Diving Certification</span>
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-700">
              Experience the thrill of underwater exploration with our exclusive scuba
              diving packages at{" "}
              <strong className="font-bold text-teal-deep">
                BIDA – BiNuKBoK Dive Academy
              </strong>
              . Perfect for adventurers of all skill levels, from first-time divers to
              those seeking advanced certifications.
            </p>
            <div className="mb-8 grid grid-cols-2 gap-4">
              {featuredPoints.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal-deep">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-bold text-navy">{title}</p>
                    <p className="text-sm text-gray-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/diving"
              className="inline-flex items-center gap-2 rounded-full bg-teal-deep px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-teal"
            >
              Explore Diving Programs <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- ACCOMMODATIONS PREVIEW ---------------- */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
              Accommodations
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-navy sm:text-4xl">
              Find Your Perfect Stay
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-navy/60">
              From cozy couples retreats to family adventures, we have the perfect
              accommodation waiting for you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((room) => (
              <div key={room.slug}>
                <RoomImageCard room={room} compact />
                <div className="mt-4 px-1">
                  <h3 className="text-base font-bold text-navy">{room.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-navy/60">
                    {room.description.split(".")[0]}.
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-navy/60">
                      <Users className="h-3.5 w-3.5" />
                      {room.guests.replace("Up to ", "")}
                    </span>
                    <Link
                      href="/book"
                      className="flex items-center gap-1 text-xs font-semibold text-teal hover:text-teal-deep"
                    >
                      Book Now <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/accommodations"
              className="inline-block rounded-full border border-navy/20 px-7 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
            >
              View All Accommodations
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy to-teal-deep py-20 text-white">
        <Quote className="absolute left-6 top-10 h-24 w-24 text-white/5" />
        <Quote className="absolute bottom-10 right-6 h-24 w-24 text-white/5" />
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold text-teal-bright">Guest Reviews</span>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              What Our Guests Say
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
              Join thousands of happy guests who made unforgettable memories at BiNuKBoK
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                <div className="mb-3 flex gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarFilled key={i} className="h-4 w-4" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white/85">“{t.quote}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-bright text-sm font-bold text-navy">
                    {t.initial}
                  </span>
                  <span className="text-sm font-semibold">{t.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 grid max-w-2xl gap-6 mx-auto grid-cols-3 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-teal-bright">{s.value}</p>
                <p className="mt-1 text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-6 lg:grid-cols-2 lg:px-8">
          {/* phone mockup */}
          <div className="relative rounded-2xl bg-cream-soft p-6">
            <div className="mb-4 rounded-lg bg-white/70 p-4 text-xs leading-relaxed text-navy/70 shadow-sm">
              <p className="mb-1 font-bold text-navy">GUEST REVIEW!</p>
              <p className="line-clamp-4">{testimonials[0].quote}</p>
              <p className="mt-2 font-semibold text-teal">{testimonials[0].name}</p>
            </div>
            <div className="placeholder h-56 w-full rounded-xl">Guest Photo</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="placeholder h-14 rounded">Photo</div>
              <div className="placeholder h-14 rounded">Photo</div>
              <div className="placeholder h-14 rounded">Photo</div>
            </div>
          </div>

          {/* CTA card */}
          <div className="flex flex-col justify-center rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="text-3xl font-extrabold text-navy">
              Ready to Experience Paradise?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy/70">
              Plan your 2026 getaway and explore the treasures of Bauan, Batangas. Book
              now and create memories that last a lifetime.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10 text-teal">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-navy">Location</p>
                  <p className="text-navy/60">Bauan, Batangas, Philippines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-coral/10 text-coral">
                  <Phone className="h-5 w-5" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-navy">Contact Us</p>
                  <p className="text-navy/60">{contact.phone}</p>
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="rounded-full bg-coral px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
              >
                Book Now
              </Link>
              <a
                href="#"
                className="rounded-full border border-navy/20 px-7 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
              >
                Visit Facebook
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
