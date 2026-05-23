import type { Metadata } from "next";
import QRCode from "qrcode";
import { getBookingByViewToken } from "@/lib/db/bookings";
import { googleCalendarUrl } from "@/lib/calendar";
import { contact } from "@/lib/data";
import { Calendar, Check, Clock, Phone } from "@/components/Icons";

// Never cache a page that shows personal info; keep it out of search engines.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Booking — BiNuKBoK VieW PoiNT ReSoRT",
  robots: { index: false, follow: false },
};

const LINK_VALID_AFTER_CHECKOUT_MS = 24 * 60 * 60 * 1000;

const HEADER: Record<
  string,
  { bg: string; Icon: typeof Check; heading: string; subtitle: string; pill: string; pillLabel: string }
> = {
  PENDING_PAYMENT: { bg: "bg-navy", Icon: Clock, heading: "We've Got You!", subtitle: "Booking received — one quick step to lock it in.", pill: "bg-amber-200 text-amber-900", pillLabel: "Awaiting deposit" },
  PAYMENT_REVIEW: { bg: "bg-navy", Icon: Clock, heading: "Almost There!", subtitle: "We're checking your deposit right now.", pill: "bg-amber-200 text-amber-900", pillLabel: "Verifying payment" },
  CONFIRMED: { bg: "bg-teal", Icon: Check, heading: "You're All Set!", subtitle: "Your stay is confirmed. See you at the resort!", pill: "bg-green-200 text-green-900", pillLabel: "Booked" },
  CHECKED_IN: { bg: "bg-teal-deep", Icon: Check, heading: "Welcome!", subtitle: "You're checked in — enjoy your stay.", pill: "bg-blue-200 text-blue-900", pillLabel: "Arrived" },
  COMPLETED: { bg: "bg-navy", Icon: Check, heading: "Thank You!", subtitle: "We hope you enjoyed your stay.", pill: "bg-gray-200 text-gray-800", pillLabel: "Completed" },
};

function NotAvailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-navy">Booking link unavailable</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-navy/80">
          This link is invalid, has expired, or the booking was cancelled. If you need help, call us at{" "}
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="font-bold text-teal underline underline-offset-2">
            {contact.phone}
          </a>
          .
        </p>
      </div>
    </main>
  );
}

export default async function BookingViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByViewToken(token);

  const invalid =
    !booking ||
    booking.status === "CANCELLED" ||
    booking.status === "EXPIRED" ||
    Date.now() > booking.checkOut.getTime() + LINK_VALID_AFTER_CHECKOUT_MS;

  if (invalid || !booking) return <NotAvailable />;

  const awaitingPayment = booking.status === "PENDING_PAYMENT" || booking.status === "PAYMENT_REVIEW";
  const qrDataUrl = awaitingPayment ? null : await QRCode.toDataURL(booking.confirmationCode, { width: 360, margin: 1 });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const viewUrl = `${base}/b/${token}`;
  const calendarUrl = googleCalendarUrl({
    title: `Stay at BiNuKBoK VieW PoiNT ReSoRT — ${booking.roomUnit.roomType.name}`,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    location: contact.location,
    details: `Booking reference: ${booking.confirmationCode}\nShow your QR code on arrival.\nView your booking: ${viewUrl}`,
  });

  const cfg = HEADER[booking.status] ?? HEADER.CONFIRMED;
  const Icon = cfg.Icon;
  const codeSpoken = `Booking code: ${booking.confirmationCode.split("").join(" ")}`;
  const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeZone: "UTC" });

  return (
    <main className="min-h-screen bg-cream px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-navy/5">
          {/* Celebration header */}
          <div className={`${cfg.bg} px-6 py-8 text-center text-white`}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/85">
              BiNuKBoK VieW PoiNT ReSoRT
            </p>
            <span className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <Icon className="h-8 w-8" />
            </span>
            <h1 className="mt-4 text-[clamp(1.6rem,5vw,2rem)] font-extrabold">{cfg.heading}</h1>
            <p className="mx-auto mt-2 max-w-xs text-[17px] leading-relaxed text-white/90">{cfg.subtitle}</p>
            <span className={`mt-5 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${cfg.pill}`}>
              {cfg.pillLabel}
            </span>
          </div>

          {/* Progress steps (while awaiting deposit) */}
          {awaitingPayment && (
            <div className="flex items-center justify-center gap-2 border-b border-navy/10 px-4 py-5">
              <StepDot label="Reserved" state="done" num="✓" />
              <span className="h-0.5 w-6 bg-navy/15" />
              <StepDot label="Deposit" state="current" num="2" />
              <span className="h-0.5 w-6 bg-navy/15" />
              <StepDot label="Confirmed" state="upcoming" num="3" />
            </div>
          )}

          {/* Primary action: deposit (pending) OR QR pass (confirmed) */}
          <div className="px-6 pt-6">
            {awaitingPayment ? (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
                <h2 className="text-xl font-extrabold text-amber-900">
                  Send your ₱{booking.depositAmount.toLocaleString()} deposit
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-[16px] leading-relaxed text-amber-900/90">
                  to lock in your dates. The balance is paid when you arrive.
                </p>
                <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-white px-4 py-7 text-amber-800">
                  <Phone className="h-6 w-6" />
                  <p className="text-[16px] font-bold">GCash details coming shortly</p>
                  <p className="text-[15px] text-amber-800/80">We&apos;ll message you the payment details soon.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-navy/10">
                <p className="text-[17px] font-bold text-navy">Show this at the resort gate</p>
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={`QR entry pass for booking ${booking.confirmationCode}`}
                    width={240}
                    height={240}
                    className="mx-auto mt-4 h-60 w-60 max-w-full"
                  />
                )}
              </div>
            )}

            {/* Booking code "ticket" */}
            <div className="mt-5 rounded-2xl bg-cream px-4 py-5 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-navy/70">Your booking code</p>
              <p className="mt-1.5 font-mono text-3xl font-extrabold tracking-[0.18em] text-navy" aria-label={codeSpoken}>
                {booking.confirmationCode}
              </p>
              {awaitingPayment && (
                <p className="mt-2 text-[15px] text-navy/70">Once we confirm your deposit, your QR pass appears here.</p>
              )}
            </div>
          </div>

          {/* Details */}
          <dl className="space-y-4 border-t border-navy/10 px-6 py-7 text-[17px] leading-relaxed">
            <Row label="Guest" value={booking.guest.fullName} />
            <Row label="Room" value={`${booking.roomUnit.roomType.name} (${booking.roomUnit.label})`} />
            <Row label="Check-in" value={dateFmt.format(booking.checkIn)} />
            <Row label="Check-out" value={dateFmt.format(booking.checkOut)} />
            <Row label="Nights" value={String(booking.nights)} />
            {booking.diveAddons.length > 0 && (
              <Row label="Diving" value={booking.diveAddons.map((a) => `${a.divePackage.name} ×${a.participants}`).join(", ")} />
            )}
          </dl>

          {/* Add to calendar */}
          <div className="px-6 pb-8">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-teal px-6 py-4 text-[17px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/50 focus-visible:ring-offset-2"
            >
              <Calendar className="h-5 w-5" /> Add to Google Calendar
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-navy/70">
          Keep this page handy — it&apos;s your booking. Need help?{" "}
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="font-bold text-teal underline underline-offset-2 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-teal/50"
          >
            {contact.phone}
          </a>
        </p>
      </div>
    </main>
  );
}

function StepDot({ label, state, num }: { label: string; state: "done" | "current" | "upcoming"; num: string }) {
  const dot =
    state === "done"
      ? "bg-teal text-white"
      : state === "current"
        ? "bg-teal text-white ring-4 ring-teal/25"
        : "bg-navy/15 text-navy/70";
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${dot}`}>{num}</span>
      <span className={`text-sm font-semibold ${state === "upcoming" ? "text-navy/60" : "text-navy"}`}>{label}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 font-medium text-navy/75">{label}</dt>
      <dd className="text-right font-semibold text-navy">{value}</dd>
    </div>
  );
}
