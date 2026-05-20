import type { Metadata } from "next";
import { BookingForm } from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Book Your Stay | Binukbok View Point Resort",
  description: "Reserve your room and diving experience at Binukbok View Point Resort.",
};

export default function BookPage() {
  return (
    <>
      {/* hero */}
      <section className="bg-gradient-to-b from-navy to-teal-deep py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Reservations
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Book Your Stay</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/80">
            Reserve your room and diving experience at Binukbok View Point Resort
          </p>
        </div>
      </section>

      {/* form */}
      <section className="bg-cream py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <BookingForm />
        </div>
      </section>
    </>
  );
}
