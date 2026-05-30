"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction } from "@/app/(site)/book/actions";
import type { DiveOption, RoomTypeOption } from "@/lib/db/catalog";
import { Users, Home, Waves, ArrowRight, Phone } from "./Icons";

export function BookingForm({
  roomTypes,
  divePackages,
  initialDivePackageId,
}: {
  roomTypes: RoomTypeOption[];
  divePackages: DiveOption[];
  initialDivePackageId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roomSlug, setRoomSlug] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [diving, setDiving] = useState(Boolean(initialDivePackageId));
  const [divePackageId, setDivePackageId] = useState(initialDivePackageId ?? "");
  const [participants, setParticipants] = useState(1);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedRoom = roomTypes.find((r) => r.slug === roomSlug);
  const selectedDive = divePackages.find((d) => d.id === divePackageId);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const effectiveNights = nights > 0 ? nights : 1;
  const roomTotal = selectedRoom ? selectedRoom.basePricePerNight * effectiveNights : 0;
  const diveTotal = diving && selectedDive ? selectedDive.price * participants : 0;
  const total = roomTotal + diveTotal;

  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10); // Manila

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await createBookingAction({
        fullName,
        email,
        phone,
        roomTypeSlug: roomSlug,
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests || undefined,
        diveAddons: diving && divePackageId ? [{ divePackageId, participants }] : [],
      });
      if (res.ok) {
        router.push(`/b/${res.viewToken}`);
      } else {
        setErrorMsg(res.message ?? "Something went wrong. Please try again.");
        setFieldErrors(res.errors ?? {});
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-extrabold text-navy">Reservation Details</h2>

        {errorMsg && (
          <p className="mt-4 rounded-lg bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{errorMsg}</p>
        )}

        {/* guest info */}
        <h3 className="mt-7 flex items-center gap-2 text-sm font-bold text-teal">
          <Users className="h-5 w-5" /> Guest Information
        </h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Full Name" required error={fieldErrors.fullName}>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" className={input} />
          </Field>
          <Field label="Phone Number" required error={fieldErrors.phone}>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XX XXX XXXX" className={input} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Email Address" required error={fieldErrors.email}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={input} />
          </Field>
        </div>

        {/* accommodation */}
        <h3 className="mt-8 flex items-center gap-2 text-sm font-bold text-teal">
          <Home className="h-5 w-5" /> Accommodation
        </h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Check-in Date" required error={fieldErrors.checkIn}>
            <input type="date" required min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={input} />
          </Field>
          <Field label="Check-out Date" required error={fieldErrors.checkOut}>
            <input type="date" required min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={input} />
          </Field>
          <Field label="Room Type" required error={fieldErrors.roomTypeSlug}>
            <select required value={roomSlug} onChange={(e) => setRoomSlug(e.target.value)} className={input}>
              <option value="">Select room type</option>
              {roomTypes.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name} — ₱{r.basePricePerNight.toLocaleString()}/night
                </option>
              ))}
            </select>
          </Field>
          <Field label="Number of Guests" required error={fieldErrors.guests}>
            <input type="number" min={1} max={selectedRoom?.maxGuests ?? 20} value={guests} onChange={(e) => setGuests(Number(e.target.value))} required className={input} />
          </Field>
        </div>
        {selectedRoom && <p className="mt-2 text-xs text-navy/50">This room holds up to {selectedRoom.maxGuests} guests.</p>}

        {/* diving add-on */}
        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-medium text-navy">
          <input type="checkbox" checked={diving} onChange={(e) => setDiving(e.target.checked)} className="h-4 w-4 rounded border-navy/30 accent-teal" />
          <Waves className="h-5 w-5 text-teal" />
          Add Diving Experience
        </label>
        {diving && (
          <div className="mt-4 grid gap-5 rounded-xl bg-cream/70 p-5 sm:grid-cols-[2fr_1fr]">
            <Field label="Diving Course" required>
              <select value={divePackageId} onChange={(e) => setDivePackageId(e.target.value)} className={input}>
                <option value="">Select a course</option>
                {divePackages.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — ₱{d.price.toLocaleString()} ({d.unit})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Participants" required>
              <input type="number" min={1} max={20} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} className={input} />
            </Field>
          </div>
        )}

        {/* special requests */}
        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-semibold text-navy">Special Requests (Optional)</label>
          <textarea rows={4} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} maxLength={500} placeholder="Any special requests or notes..." className={`${input} resize-none`} />
        </div>

        <button type="submit" disabled={isPending} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Reserving…" : (<>Reserve &amp; Get Booking Link <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </form>

      {/* summary */}
      <aside className="h-fit rounded-2xl bg-navy p-7 text-white">
        <h2 className="text-xl font-extrabold">Booking Summary</h2>
        <div className="my-5 h-px bg-white/15" />

        {selectedRoom && (
          <div className="mb-3 flex justify-between text-sm text-white/80">
            <span>{selectedRoom.name}{nights > 0 && ` × ${nights} night${nights > 1 ? "s" : ""}`}</span>
            <span>₱{roomTotal.toLocaleString()}</span>
          </div>
        )}
        {diving && selectedDive && (
          <div className="mb-3 flex justify-between text-sm text-white/80">
            <span>{selectedDive.name} × {participants}</span>
            <span>₱{diveTotal.toLocaleString()}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-teal-bright">₱{total.toLocaleString()}</span>
        </div>

        <div className="mt-6 rounded-lg bg-white/10 p-4 text-xs leading-relaxed text-white/80">
          <strong className="text-white">₱500 deposit</strong> reserves your dates. We&apos;ll send GCash details after you reserve; the balance is paid on arrival.
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
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
