"use client";

import { useEffect, useRef, useState } from "react";
import { Close, RotateCcw, ScanLine, Sparkles } from "@/components/Icons";
import { AvailabilityChat } from "./AvailabilityChat";
import { CheckInScanner } from "./CheckInScanner";

// Trigger helpers — any admin page can call these to open the FAB tools.
export const openAdminAi = () => window.dispatchEvent(new Event("admin:open-ai"));
export const openAdminScan = () => window.dispatchEvent(new Event("admin:open-scan"));

export function AdminQuickTools() {
  const [dialOpen, setDialOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // External openers (Overview KPI card etc.) dispatch window events.
  useEffect(() => {
    const onAi = () => { setDialOpen(false); setScanOpen(false); setAiOpen(true); };
    const onScan = () => { setDialOpen(false); setAiOpen(false); setScanOpen(true); };
    window.addEventListener("admin:open-ai", onAi);
    window.addEventListener("admin:open-scan", onScan);
    return () => {
      window.removeEventListener("admin:open-ai", onAi);
      window.removeEventListener("admin:open-scan", onScan);
    };
  }, []);

  // Esc closes whichever surface is most-front.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (scanOpen) setScanOpen(false);
      else if (aiOpen) setAiOpen(false);
      else if (dialOpen) setDialOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiOpen, scanOpen, dialOpen]);

  return (
    <>
      <SpeedDialFab
        open={dialOpen}
        onToggle={() => setDialOpen((v) => !v)}
        onPickAi={() => { setDialOpen(false); setAiOpen(true); }}
        onPickScan={() => { setDialOpen(false); setScanOpen(true); }}
      />
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}

function SpeedDialFab({
  open,
  onToggle,
  onPickAi,
  onPickScan,
}: {
  open: boolean;
  onToggle: () => void;
  onPickAi: () => void;
  onPickScan: () => void;
}) {
  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div>
        {/* Fan-out actions */}
        <div
          id="admin-quick-tools-actions"
          className={`flex flex-col items-end gap-2 transition-all duration-150 ${
            open ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
          }`}
          aria-hidden={!open}
        >
          <button
            type="button"
            onClick={onPickScan}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-navy shadow-lg ring-1 ring-navy/10 transition hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
          >
            <ScanLine className="h-4 w-4" />
            Scan check-in
          </button>
          <button
            type="button"
            onClick={onPickAi}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-navy shadow-lg ring-1 ring-navy/10 transition hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>
        </div>

        {/* Primary toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="admin-quick-tools-actions"
          aria-label={open ? "Close quick tools" : "Open quick tools"}
          className={`pointer-events-auto mt-3 grid h-14 w-14 place-items-center rounded-full bg-teal text-white shadow-xl transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 ${
            open ? "rotate-45" : ""
          }`}
        >
          {open ? <Close className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}

function AiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Held in a ref so the panel header's "Clear" button can call into the
  // child without re-rendering the chat (which would unmount it and lose state).
  const clearRef = useRef<() => void>(() => {});

  return (
    <div
      role="dialog"
      aria-label="Availability assistant"
      inert={!open || undefined}
      // translate-x-full when closed keeps the chat mounted (so useChat history
      // survives) but off-screen. inert (HTML attribute, native React 19 support)
      // suppresses focus, pointer events, and AT visibility for the closed state.
      className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col bg-white shadow-2xl ring-1 ring-navy/10 transition-transform duration-200 md:w-[420px] ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-navy/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal-deep">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="text-[15px] font-bold text-navy">Availability assistant</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => clearRef.current()}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-3">
        <AvailabilityChat onClearReady={(c) => { clearRef.current = c; }} />
      </div>
    </div>
  );
}

function ScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mount the scanner only while open — closing unmounts it so getUserMedia
  // tracks are released by CheckInScanner's own cleanup effect.
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Check-in scanner"
      className="fixed inset-0 z-50 flex flex-col bg-navy/40 backdrop-blur-sm md:items-center md:justify-center md:p-6"
    >
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-cream shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-2xl">
        <header className="flex items-center justify-between gap-2 border-b border-navy/10 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal-deep">
              <ScanLine className="h-5 w-5" />
            </span>
            <p className="text-[15px] font-bold text-navy">Check-in scanner</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
          >
            <Close className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <CheckInScanner />
        </div>
      </div>
    </div>
  );
}
