import { Calendar as CalendarIcon } from "@/components/Icons";
import { Topbar } from "../../_components/Topbar";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <>
      <Topbar title="Calendar" />
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center ring-1 ring-navy/5">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-teal/10 text-teal-deep">
            <CalendarIcon className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold text-navy">Availability calendar</h2>
          <p className="mt-2 max-w-md text-[15px] text-navy/65">
            A month-by-month view of room availability and arrivals will live here. For now, use Bookings to find and manage reservations.
          </p>
          <span className="mt-5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
            Coming soon
          </span>
        </div>
      </div>
    </>
  );
}
