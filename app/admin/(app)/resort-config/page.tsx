import { Anchor, Bed, Settings as SettingsIcon, Waves } from "@/components/Icons";
import { Topbar } from "../../_components/Topbar";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { title: "Room types & rates", desc: "Couple, Family, Kubo, Camping — pricing & capacity.", Icon: Bed },
  { title: "Dive packages", desc: "Discovery, Open Water, Freediving, Fun Dive.", Icon: Anchor },
  { title: "Facilities", desc: "Pool, beachfront bar, dive center and lounge.", Icon: Waves },
];

export default function ResortConfigPage() {
  return (
    <>
      <Topbar title="Resort Config" />
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-center gap-2 text-navy/70">
          <SettingsIcon className="h-5 w-5" />
          <p className="text-[15px]">Configure the catalog the public site and booking flow use.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-2xl bg-white p-6 ring-1 ring-navy/5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal-deep">
                <s.Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-[17px] font-bold text-navy">{s.title}</h2>
              <p className="mt-1 text-[14px] text-navy/65">{s.desc}</p>
              <span className="mt-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
