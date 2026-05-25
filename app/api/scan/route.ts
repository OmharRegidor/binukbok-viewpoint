import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { checkInByCode } from "@/lib/db/admin";
import { rateLimit } from "@/lib/rate-limit";

// Admin QR check-in endpoint (SYSTEM-DESIGN.md §7). The scanner page POSTs the
// decoded confirmation_code here; we verify the admin, throttle, then flip the
// booking to CHECKED_IN via the gated data-layer function. Uses the Node runtime
// (Prisma). Middleware bypasses /api/*, so this handler self-gates.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept any short trimmed string at parse time; we then upper-case and match the
// exact confirmation-code shape so manual entry can be lowercase. CODE_RE mirrors
// generateConfirmationCode() ("BVP-" + 6 chars), rejecting URLs / poisoned QRs /
// junk before any DB lookup.
const Body = z.object({ code: z.string().trim().min(1).max(64) });
const CODE_RE = /^BVP-[A-Z2-9]{6}$/;

const LIMIT = 60; // scans
const WINDOW_MS = 60_000; // per minute, per admin

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ ok: false, message: "Not signed in as an admin." }, { status: 401 });

  const rl = rateLimit(`scan:${admin.id}`, LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return Response.json(
      { ok: false, message: "Too many scans — wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "Couldn't read that code." }, { status: 400 });

  const code = parsed.data.code.toUpperCase();
  if (!CODE_RE.test(code)) return Response.json({ ok: false, message: "That doesn't look like a booking code." }, { status: 400 });

  const result = await checkInByCode(code, admin.id);
  // Business outcomes (not found / wrong state) return 200 with ok:false so the
  // scanner can show the specific reason; only auth/throttle/parse use 4xx.
  return Response.json(result);
}
