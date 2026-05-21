import Link from "next/link";
import { Logo } from "./Logo";
import { contact } from "@/lib/data";
import { MapPin, Phone, Mail, Facebook, Instagram } from "./Icons";

export function Footer() {
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <Logo size={42} />
          </div>
          <h3 className="mb-3 text-base font-bold text-white">BiNuKBoK VieW PoiNT</h3>
          <p className="text-sm leading-relaxed text-white/60">
            Your ultimate beach destination in Bauan, Batangas. Experience diving,
            relaxation, and authentic Filipino hospitality.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-teal-bright">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/accommodations" className="hover:text-white">Accommodations</Link></li>
            <li><Link href="/diving" className="hover:text-white">Diving Programs</Link></li>
            <li><Link href="/book" className="hover:text-white">Book Now</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-teal-bright">Contact Us</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-bright" />
              <span>{contact.location}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-teal-bright" />
              <span>{contact.phone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-teal-bright" />
              <span>{contact.social}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold text-teal-bright">Follow Us</h4>
          <p className="mb-4 text-sm text-white/60">
            Stay updated with our latest offers and resort updates!
          </p>
          <div className="flex gap-3">
            <a
              href="https://www.facebook.com/binukbok"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/binukbokviewpoint/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-white/50 lg:px-8">
          © 2026 BiNuKBoK VieW PoiNT ReSoRT. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
