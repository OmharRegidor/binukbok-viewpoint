import Link from "next/link";
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
      <section className="hero-wash relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center lg:px-8">
          {/* taped polaroids */}
          <div className="pointer-events-none absolute inset-0 hidden items-start justify-between px-10 pt-24 lg:flex">
            <div className="-rotate-6 rounded-md bg-white p-2 shadow-xl">
              <div className="placeholder h-40 w-56">Sunset Photo</div>
            </div>
            <div className="rotate-6 rounded-md bg-white p-2 shadow-xl">
              <div className="placeholder h-40 w-56">Resort Photo</div>
            </div>
          </div>

          <div className="relative mx-auto max-w-2xl">
            <Logo size={84} className="mx-auto mb-6 shadow-lg ring-4 ring-white/40" />
            <h1 className="text-5xl font-extrabold leading-tight text-white sm:text-6xl">
              Binukbok
            </h1>
            <p className="text-gradient-teal text-4xl font-extrabold sm:text-5xl">
              View Point Resort
            </p>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              Discover paradise in Bauan, Batangas. Experience breathtaking sunsets,
              world-class diving, and authentic Filipino hospitality.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/book"
                className="rounded-full bg-coral px-7 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-coral-dark"
              >
                Book Your Stay
              </Link>
              <Link
                href="/diving"
                className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-navy shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Waves className="h-4 w-4 text-teal" />
                Explore Diving
              </Link>
            </div>
            <ChevronDown className="mx-auto mt-12 h-6 w-6 animate-bounce text-white/80" />
          </div>
        </div>
      </section>

      {/* ---------------- SCUBA FEATURED ---------------- */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
          {/* left visual card */}
          <div className="relative">
            <div className="rounded-2xl bg-teal-deep p-6 text-white shadow-xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="placeholder h-40 rounded-lg">Diver Photo</div>
                <div className="space-y-3">
                  <div className="placeholder h-[4.5rem] rounded-lg">Diver</div>
                  <div className="placeholder h-[4.5rem] rounded-lg">Coral</div>
                </div>
              </div>
              <h3 className="mt-5 text-3xl font-extrabold leading-none">
                SCUBA<br />DIVING
              </h3>
              <p className="mt-3 text-sm text-white/85">
                Experience the thrill of underwater exploration with our exclusive
                scuba diving packages, perfect for adventurers of all skill levels.
              </p>
              <p className="mt-4 text-xs font-medium text-teal-bright">
                @binukbokviewpoint
              </p>
            </div>
            <div className="absolute -bottom-4 right-6 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-lg">
              <Award className="h-5 w-5 text-teal" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-navy">BIDA</p>
                <p className="text-[10px] text-navy/60">Dive Academy</p>
              </div>
            </div>
          </div>

          {/* right text */}
          <div>
            <span className="inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
              Featured Experience
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-navy sm:text-4xl">
              Get Your Scuba <span className="text-teal">Diving</span> Certification
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-navy/70">
              Experience the thrill of underwater exploration with our exclusive scuba
              diving packages at <strong>BIDA – Binukbok Dive Academy</strong>. Perfect
              for adventurers of all skill levels, from first-time divers to those
              seeking advanced certifications.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {featuredPoints.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">{title}</p>
                    <p className="text-xs text-navy/60">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/diving"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-teal-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal"
            >
              Explore Diving Programs <ArrowRight className="h-4 w-4" />
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
              Join thousands of happy guests who made unforgettable memories at Binukbok
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
