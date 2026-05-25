"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, ScanLine } from "@/components/Icons";

// Admin QR check-in (SYSTEM-DESIGN.md §7). Streams the camera with getUserMedia and
// decodes each frame with jsQR (pure-JS, works in every browser — Chrome desktop,
// Safari, Firefox). The decoded confirmation_code is POSTed to /api/scan, which
// flips the booking to CHECKED_IN. If the camera is unavailable (no permission /
// no getUserMedia), the manual code-entry form is the fallback — check-in is never
// a dead end.

type ScanResponse =
  | { ok: true; alreadyArrived: boolean; booking: { confirmationCode: string; guestName: string; room: string; checkOut: string; balanceDue: number } }
  | { ok: false; message: string };

type CameraState = "starting" | "on" | "denied" | "unsupported";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
// DATE columns are stored UTC-midnight = the Manila calendar date; format in UTC to
// match the rest of the app (Overview, Bookings, /b/[token]).
const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });
const DEBOUNCE_MS = 6000;
const FETCH_TIMEOUT_MS = 15000;
const SCAN_INTERVAL_MS = 300;
const MAX_SAMPLE_PX = 1024; // cap the decoded frame size so jsQR stays fast

export function CheckInScanner() {
  const [camera, setCamera] = useState<CameraState>("starting");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSubmit = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const inFlight = useRef(false);
  const detecting = useRef(false);
  const mounted = useRef(true);
  // Pause the detection loop while a result is shown or a request is in flight.
  // Synced from state in an effect (never written during render).
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = result !== null || busy;
  }, [result, busy]);

  const submit = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code || inFlight.current) return;
    const key = code.toUpperCase();
    const now = Date.now();
    if (lastSubmit.current.code === key && now - lastSubmit.current.at < DEBOUNCE_MS) return;

    inFlight.current = true;
    lastSubmit.current = { code: key, at: now };
    setBusy(true);
    if (typeof navigator !== "undefined") navigator.vibrate?.(60); // tactile "captured" cue

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      });
      const data: ScanResponse = await res.json().catch(() => ({ ok: false, message: "Unexpected server response." }));
      if (mounted.current) setResult(data);
    } catch (err) {
      if (mounted.current) {
        const timedOut = err instanceof DOMException && err.name === "AbortError";
        setResult({
          ok: false,
          message: timedOut
            ? "Request timed out — check your connection and try again."
            : "Network error — check your connection and try again.",
        });
      }
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  // Decode the current video frame with jsQR; returns the QR text or null.
  const readFrame = useCallback((): string | null => {
    const v = videoRef.current;
    const canvas = canvasRef.current;
    if (!v || !canvas || v.readyState < 2 || !v.videoWidth) return null;

    const scale = Math.min(1, MAX_SAMPLE_PX / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    return jsQR(data, w, h, { inversionAttempts: "dontInvert" })?.data?.trim() || null;
  }, []);

  // Camera setup + detection loop.
  useEffect(() => {
    mounted.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported");
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!mounted.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setCamera("on");

        interval = setInterval(() => {
          if (pausedRef.current || detecting.current) return;
          detecting.current = true;
          try {
            const hit = readFrame();
            if (hit) submit(hit);
          } catch {
            /* transient decode error — ignore this frame */
          } finally {
            detecting.current = false;
          }
        }, SCAN_INTERVAL_MS);
      } catch {
        if (mounted.current) setCamera("denied");
      }
    })();

    return () => {
      mounted.current = false;
      if (interval) clearInterval(interval);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [readFrame, submit]);

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(manualCode);
    setManualCode("");
  }

  const cameraLive = camera === "on";

  return (
    <div className="space-y-5">
      {/* Viewfinder */}
      <section className="overflow-hidden rounded-2xl bg-navy ring-1 ring-navy/10">
        <div className="relative aspect-square w-full sm:aspect-[4/3]">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label="Camera viewfinder for scanning a guest's QR code"
            className={`h-full w-full object-cover ${cameraLive ? "" : "hidden"}`}
          />
          {/* Offscreen frame buffer for jsQR */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scan reticle (decorative) — turns teal while a scan is processing */}
          {cameraLive && !result && (
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className={`aspect-square h-[72%] max-h-96 rounded-2xl border-4 shadow-[0_0_0_9999px_rgba(28,58,94,0.35)] transition-colors ${
                  busy ? "border-teal-bright" : "border-white/80"
                }`}
              />
            </div>
          )}

          {/* Camera unavailable / starting placeholder */}
          {!cameraLive && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-cream">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
                  <ScanLine className="h-8 w-8" />
                </span>
                <p className="mt-4 text-[15px] font-semibold">
                  {camera === "starting" && "Starting camera…"}
                  {camera === "denied" && "Camera access was blocked."}
                  {camera === "unsupported" && "No camera available on this device."}
                </p>
                <p className="mt-1 text-[13px] text-cream/85">
                  {camera === "denied"
                    ? "Allow camera access in your browser, or enter the booking code below."
                    : camera === "unsupported"
                      ? "Enter the booking code below to check the guest in."
                      : "Point the camera at the guest’s QR code."}
                </p>
              </div>
            </div>
          )}

          {/* Result overlay (scrollable so a tall card is reachable on short screens) */}
          {result && (
            <div className="absolute inset-0 overflow-y-auto bg-navy/80">
              <div className="flex min-h-full items-center justify-center p-5">
                <ResultCard result={result} onNext={() => setResult(null)} />
              </div>
            </div>
          )}
        </div>

        {cameraLive && !result && (
          <p className="px-4 py-3 text-center text-[13px] font-medium text-cream/85" aria-live="polite">
            {busy ? "Checking…" : "Hold the guest’s QR code inside the frame"}
          </p>
        )}
      </section>

      {/* Manual entry — always available, primary fallback when there's no camera */}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-navy/5">
        <h2 className="text-[15px] font-bold text-navy">Enter code manually</h2>
        <p className="mt-0.5 text-[13px] text-navy/60">Type the booking code printed under the guest’s QR (e.g. BVP-XXXXXX).</p>
        <form onSubmit={onManualSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="BVP-XXXXXX"
            aria-label="Booking confirmation code"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-h-[48px] flex-1 rounded-xl border-2 border-navy/20 px-4 font-mono text-[16px] uppercase tracking-wider text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
          <button
            type="submit"
            disabled={busy || !manualCode.trim()}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-navy px-6 text-[15px] font-bold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Check in"}
          </button>
        </form>
      </section>
    </div>
  );
}

function ResultCard({ result, onNext }: { result: ScanResponse; onNext: () => void }) {
  if (result.ok) {
    const b = result.booking;
    return (
      <div role="status" aria-live="polite" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center ring-1 ring-navy/10">
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
            result.alreadyArrived ? "bg-amber-100 text-amber-700" : "bg-teal/15 text-teal-deep"
          }`}
        >
          <Check className="h-8 w-8" />
        </span>
        <p className="mt-3 text-xl font-extrabold text-navy">{result.alreadyArrived ? "Already checked in" : "Checked in"}</p>
        <p className="mt-0.5 text-[15px] font-semibold text-navy">{b.guestName}</p>
        <p className="text-[14px] text-navy/65">{b.room}</p>

        <dl className="mt-4 space-y-1.5 rounded-xl bg-cream/60 p-3 text-left text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-navy/60">Balance to collect</dt>
            <dd className="font-bold text-navy">{peso.format(b.balanceDue)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-navy/60">Checks out</dt>
            <dd className="font-semibold text-navy">{dateFmt.format(new Date(b.checkOut))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-navy/60">Code</dt>
            <dd className="font-mono font-bold tracking-wider text-navy">{b.confirmationCode}</dd>
          </div>
        </dl>

        {result.alreadyArrived && (
          <p className="mt-3 rounded-lg bg-amber-100 px-3 py-1.5 text-[13px] font-medium text-amber-900">
            This guest was already marked arrived earlier.
          </p>
        )}

        <button
          type="button"
          onClick={onNext}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-teal px-6 text-[15px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
        >
          Scan next guest
        </button>
      </div>
    );
  }

  return (
    <div role="alert" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center ring-1 ring-navy/10">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral/15 text-coral-dark">
        <AlertCircle className="h-8 w-8" />
      </span>
      <p className="mt-3 text-xl font-extrabold text-navy">Can’t check in</p>
      <p className="mt-1 text-[15px] text-navy/70">{result.message}</p>
      <button
        type="button"
        onClick={onNext}
        className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-navy px-6 text-[15px] font-bold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30"
      >
        Try again
      </button>
    </div>
  );
}
