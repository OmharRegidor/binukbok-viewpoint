"use client";

import { useMemo, useState } from "react";
import { rooms } from "@/lib/data";
import { Users, Home, Waves, ArrowRight, Check, Phone } from "./Icons";

const DIVE_FEE = 3500; // Discovery Dive add-on

export function BookingForm() {
  const [roomSlug, setRoomSlug] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [diving, setDiving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedRoom = rooms.find((r) => r.slug === roomSlug);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const effectiveNights = nights > 0 ? nights : 1;
  const roomTotal = selectedRoom ? selectedRoom.price * effectiveNights : 0;
  const total = roomTotal + (diving ? DIVE_FEE : 0);

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
          <Check className="h-8 w-8" />
        </span>
        <h2 className="text-2xl font-extrabold text-navy">Reservation Received!</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-navy/70">
          Thank you. This is a reservation request — we&apos;ll confirm availability and
          contact you within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-full border border-navy/20 px-6 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white"
        >
          Make Another Reservation
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      {/* form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="rounded-2xl bg-white p-8 shadow-lg"
      >
        <h2 className="text-2xl font-extrabold text-navy">Reservation Details</h2>

        {/* guest info */}
        <h3 className="mt-7 flex items-center gap-2 text-sm font-bold text-teal">
          <Users className="h-5 w-5" /> Guest Information
        </h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Full Name" required>
            <input type="text" required placeholder="Juan Dela Cruz" className={input} />
          </Field>
          <Field label="Phone Number" required>
            <input type="tel" required placeholder="09XX XXX XXXX" className={input} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Email Address" required>
            <input type="email" required placeholder="your@email.com" className={input} />
          </Field>
        </div>

        {/* accommodation */}
        <h3 className="mt-8 flex items-center gap-2 text-sm font-bold text-teal">
          <Home className="h-5 w-5" /> Accommodation
        </h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Check-in Date" required>
            <input
              type="date"
              required
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Check-out Date" required>
            <input
              type="date"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Room Type" required>
            <select
              required
              value={roomSlug}
              onChange={(e) => setRoomSlug(e.target.value)}
              className={input}
            >
              <option value="">Select room type</option>
              {rooms.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name} — ₱{r.price.toLocaleString()}/night
                </option>
              ))}
            </select>
          </Field>
          <Field label="Number of Guests" required>
            <input type="number" min={1} defaultValue={2} required className={input} />
          </Field>
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-medium text-navy">
          <input
            type="checkbox"
            checked={diving}
            onChange={(e) => setDiving(e.target.checked)}
            className="h-4 w-4 rounded border-navy/30 accent-teal"
          />
          <Waves className="h-5 w-5 text-teal" />
          Add Diving Experience
        </label>

        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-semibold text-navy">
            Special Requests (Optional)
          </label>
          <textarea
            rows={4}
            placeholder="Any special requests or notes..."
            className={`${input} resize-none`}
          />
        </div>

        <button
          type="submit"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark"
        >
          Submit Reservation <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* summary */}
      <aside className="h-fit rounded-2xl bg-navy p-7 text-white">
        <h2 className="text-xl font-extrabold">Booking Summary</h2>
        <div className="my-5 h-px bg-white/15" />

        {selectedRoom && (
          <div className="mb-3 flex justify-between text-sm text-white/80">
            <span>
              {selectedRoom.name}
              {nights > 0 && ` × ${nights} night${nights > 1 ? "s" : ""}`}
            </span>
            <span>₱{roomTotal.toLocaleString()}</span>
          </div>
        )}
        {diving && (
          <div className="mb-3 flex justify-between text-sm text-white/80">
            <span>Diving Experience</span>
            <span>₱{DIVE_FEE.toLocaleString()}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-teal-bright">
            ₱{total.toLocaleString()}
          </span>
        </div>

        <div className="mt-6 rounded-lg bg-white/10 p-4 text-xs leading-relaxed text-white/80">
          <strong className="text-white">Note:</strong> This is a reservation request.
          We&apos;ll confirm availability and contact you within 24 hours.
        </div>

        <div className="mt-6 text-center text-sm">
          <p className="text-white/70">Questions?</p>
          <p className="mt-1 flex items-center justify-center gap-2 font-semibold text-teal-bright">
            <Phone className="h-4 w-4" /> 0917 868 5265
          </p>
        </div>
      </aside>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-navy/40 focus:border-teal focus:ring-2 focus:ring-teal/20";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
    </div>
  );
}
