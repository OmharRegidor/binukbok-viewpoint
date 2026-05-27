"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "@/components/Icons";

const EXAMPLES = [
  "Is the Kubo free July 10 to 12?",
  "How many rooms are open this weekend?",
  "Any family rooms next month?",
];

// Admin-only, read-only availability assistant. useChat() posts to /api/chat
// (AI SDK default); the route streams gpt-4o-mini answers via a read-only tool.
export function AvailabilityChat({ onClearReady }: { onClearReady?: (clear: () => void) => void } = {}) {
  const { messages, sendMessage, status, error, setMessages } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  // Keep the latest message / stream chunk in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Callers should keep `onClearReady` stable (e.g. assign into a ref or wrap in
  // useCallback). A non-stable callback fires this effect on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onClearReady?.(clear); }, [onClearReady]);

  function clear() {
    setMessages([]);
    setInput("");
  }

  function ask(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  const lastIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex h-full min-h-[28rem] flex-col rounded-2xl bg-white ring-1 ring-navy/5">
      <div className="flex-1 space-y-4 overflow-y-auto p-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal/10 text-teal-deep">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy">Availability assistant</h2>
            <p className="mt-1 max-w-sm text-[15px] text-navy/65">
              Ask about open rooms and dates. It reads live availability — it can&rsquo;t create or change bookings.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(ex)}
                  className="rounded-full border border-navy/15 bg-cream/50 px-4 py-2 text-[14px] font-medium text-navy/80 transition hover:border-teal hover:text-teal-deep disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const text = m.parts
              .filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("");
            const toolOnly = m.role === "assistant" && !text;
            return (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[16px] ${
                    m.role === "user" ? "bg-teal text-white" : "bg-cream text-navy"
                  }`}
                >
                  {text}
                  {toolOnly && <span className="text-navy/50">Checking availability…</span>}
                </span>
              </div>
            );
          })
        )}

        {busy && lastIsUser && (
          <div className="text-left">
            <span className="inline-block rounded-2xl bg-cream px-4 py-2.5 text-[16px] text-navy/50">Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="border-t border-navy/10 px-6 py-2 text-[14px] font-medium text-coral">
          Something went wrong — please try again.
        </p>
      )}

      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-navy/10 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about availability…"
          aria-label="Ask about availability"
          className="min-h-[52px] flex-1 rounded-xl border-2 border-navy/20 px-4 text-[17px] text-navy outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="min-h-[52px] rounded-xl bg-teal px-6 text-[17px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40 disabled:opacity-60"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
