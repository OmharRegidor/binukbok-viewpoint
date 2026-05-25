"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "../actions";

const input =
  "w-full rounded-xl border-2 border-navy/20 bg-white px-4 py-3 text-[17px] text-navy outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20";

export function ChangePassword() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, null);

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-navy/5">
      <h2 className="text-xl font-bold text-navy">Change password</h2>
      <p className="mt-0.5 text-[14px] text-navy/65">At least 8 characters.</p>

      <form action={action} className="mt-4 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[14px] font-semibold text-navy">New password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-[14px] font-semibold text-navy">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={input} />
        </div>

        {state && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`text-[15px] font-medium ${state.ok ? "text-green-700" : "text-coral"}`}
          >
            {state.ok ? `${state.message} ✓` : state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="min-h-[52px] rounded-xl bg-teal px-6 text-[17px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/50 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
