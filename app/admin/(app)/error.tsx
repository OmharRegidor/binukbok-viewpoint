"use client";

// Catches unhandled errors thrown by server components or server actions inside
// the authenticated admin layout. Gives staff a branded, actionable error page
// instead of the raw Next.js crash screen.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-4xl" aria-hidden>⚠️</span>
      <h2 className="mt-4 text-2xl font-extrabold text-navy">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-[15px] text-navy/65">
        An unexpected error occurred. Try refreshing — if it persists, check your database connection.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-navy/40">Error ID: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-[48px] rounded-xl bg-teal px-8 text-[16px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
      >
        Try again
      </button>
    </div>
  );
}
