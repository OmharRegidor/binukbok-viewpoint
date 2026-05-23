"use client";

import { useActionState } from "react";
import { signInAction } from "../actions";

const input =
  "w-full rounded-lg border border-navy/15 bg-white px-4 py-3 text-[17px] text-navy outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(signInAction, { error: "" });

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <form action={action} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">BiNuKBoK VieW PoiNT ReSoRT</p>
        <h1 className="mt-1 text-2xl font-extrabold text-navy">Admin Login</h1>

        {state.error && (
          <p className="mt-4 rounded-lg bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{state.error}</p>
        )}

        <label className="mt-6 mb-1.5 block text-sm font-semibold text-navy" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} />

        <label className="mt-4 mb-1.5 block text-sm font-semibold text-navy" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />

        <button
          type="submit"
          disabled={pending}
          className="mt-7 min-h-[52px] w-full rounded-xl bg-teal px-6 text-[17px] font-bold text-white transition hover:bg-teal-bright focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/50 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
