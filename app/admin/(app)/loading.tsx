// Shown while any page inside the authenticated admin layout is loading.
// A minimal skeleton that preserves the page chrome (topbar height) so
// content doesn't jump when the server response arrives.
export default function AdminLoading() {
  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8" aria-busy="true" aria-label="Loading page content">
      {/* Topbar placeholder */}
      <div className="h-8 w-48 animate-pulse rounded-lg bg-navy/8" />

      {/* KPI row skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-navy/5" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="h-64 animate-pulse rounded-2xl bg-navy/5" />
      <div className="h-48 animate-pulse rounded-2xl bg-navy/5" />
    </div>
  );
}
