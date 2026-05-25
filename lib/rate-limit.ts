// Minimal in-memory fixed-window rate limiter.
//
// NOTE: state lives in this process only. On Vercel's serverless/multi-instance
// runtime each instance has its own window, so this is a best-effort throttle —
// good enough to blunt accidental loops / casual abuse on a low-traffic admin
// endpoint. For a hard guarantee, back it with Upstash Redis (same path the chat
// endpoint will take). Keyed by a stable per-caller id (e.g. admin user id).

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterMs: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic sweep so the map can't grow unbounded across many keys.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, retryAfterMs: 0 };
}
