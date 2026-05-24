"use client";

import { useActionState } from "react";
import type { RowState } from "../actions";

export function BookingActionRow({
  bookingId,
  label,
  pendingLabel,
  doneLabel,
  variant = "teal",
  action,
}: {
  bookingId: string;
  label: string;
  pendingLabel: string;
  doneLabel: string;
  variant?: "teal" | "navy";
  action: (prev: RowState, formData: FormData) => Promise<RowState>;
}) {
  const [state, dispatch, isPending] = useActionState(action, null);
  const done = state?.ok === true;
  const bg = variant === "teal" ? "bg-teal hover:bg-teal-bright" : "bg-navy hover:bg-navy/90";

  return (
    <form action={dispatch} className="flex flex-col items-end gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        disabled={isPending || done}
        aria-busy={isPending}
        className={`min-h-[52px] rounded-xl px-6 text-[17px] font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/50 focus-visible:ring-offset-2 disabled:opacity-70 ${done ? "bg-green-600" : bg}`}
      >
        {isPending ? pendingLabel : done ? `${doneLabel} ✓` : label}
      </button>
      {state && !state.ok && state.message && (
        <p role="alert" className="max-w-[16rem] text-right text-[15px] font-medium text-coral">{state.message}</p>
      )}
    </form>
  );
}
