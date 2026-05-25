import { requireAdmin } from "@/lib/auth";
import { ChangePassword } from "../../_components/ChangePassword";
import { signOutAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy">Account</h1>
        <p className="mt-1 text-[17px] text-navy/75">Your admin credentials.</p>
      </header>

      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-navy/5">
        <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Signed in as</p>
        <p className="mt-1 text-[19px] font-bold text-navy">{admin.email}</p>
        <span className="mt-2 inline-block rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal-deep">Admin</span>
      </section>

      <ChangePassword />

      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-navy/5">
        <h2 className="text-xl font-bold text-navy">Sign out</h2>
        <p className="mt-0.5 text-[14px] text-navy/65">End your session on this device.</p>
        <form action={signOutAction} className="mt-4">
          <button className="min-h-[52px] rounded-xl border-2 border-navy/25 px-6 text-[17px] font-bold text-navy transition hover:bg-navy hover:text-white">
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
