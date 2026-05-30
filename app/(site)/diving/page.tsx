import Link from "next/link";
import type { Metadata } from "next";
import { divePackages } from "@/lib/data";
import { Award, Users, Shield, Star, Check, ArrowRight } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Diving | BiNuKBoK Dive Academy (BIDA)",
  description:
    "Experience world-class scuba diving certification and training in the pristine waters of Batangas.",
};

const reasons = [
  { icon: Award, title: "PADI Certified", text: "Internationally recognized certifications" },
  { icon: Users, title: "Expert Instructors", text: "Patient & professional trainers" },
  { icon: Shield, title: "Safety First", text: "Top-quality equipment provided" },
  { icon: Star, title: "5-Star Rated", text: "Trusted by hundreds of divers" },
];

export default function DivingPage() {
  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-navy via-navy-light to-teal-deep py-24 text-center text-white">
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[7rem] font-extrabold leading-none text-white/5 sm:text-[10rem]"
          aria-hidden="true"
        >
          SCUBA
        </span>
        <div className="relative mx-auto max-w-3xl px-6">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            BIDA · BiNuKBoK Dive Academy
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
            Dive Into <span className="text-teal-bright">Adventure</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/80">
            Experience world-class scuba diving certification and training in the
            pristine waters of Batangas
          </p>
        </div>
      </section>

      {/* why choose BIDA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-navy sm:text-4xl">
              Why Choose BIDA?
            </h2>
            <p className="mt-3 text-sm text-navy/60">
              Our expert instructors provide hands-on training for all skill levels
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl bg-cream p-6 text-center"
              >
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal/10 text-teal">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="font-semibold text-navy">{title}</p>
                <p className="mt-1.5 text-xs text-navy/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* diving packages */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
              Our Programs
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-navy sm:text-4xl">
              Diving Packages
            </h2>
            <p className="mt-3 text-sm text-navy/60">
              From your first dive to advanced certifications, we have a program for everyone
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {divePackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ${
                  pkg.popular ? "ring-2 ring-coral" : "ring-1 ring-black/5"
                }`}
              >
                {pkg.popular && (
                  <div className="bg-coral py-1.5 text-center text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-teal">{pkg.tagline}</p>
                      <h3 className="mt-1 text-xl font-extrabold text-navy">{pkg.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-teal-deep">
                        ₱{pkg.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-navy/50">{pkg.unit}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-navy/70">
                    {pkg.description}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-navy/70">
                        <Check className="h-4 w-4 shrink-0 text-teal" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/book"
                    className={`mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-colors ${
                      pkg.popular
                        ? "bg-coral hover:bg-coral-dark"
                        : "bg-teal-deep hover:bg-teal"
                    }`}
                  >
                    Book This Package <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold">Ready to Start Your Diving Journey?</h2>
          <p className="mt-3 text-sm text-white/70">
            Contact us today to book your diving experience or ask any questions about
            our programs.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link
              href="/book"
              className="rounded-full bg-teal-bright px-8 py-3 text-sm font-semibold text-navy transition-colors hover:bg-teal"
            >
              Book Now
            </Link>
            <a
              href="#"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
