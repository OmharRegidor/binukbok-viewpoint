import type { Room } from "@/lib/data";

type Props = {
  room: Room;
  compact?: boolean;
};

// The decorative "polaroid" room card with the diagonal banner, name overlay,
// three thumbnails, BOOK NOW pill and price badge.
export function RoomImageCard({ room, compact = false }: Props) {
  return (
    <div className="relative rounded-xl bg-white p-2.5 shadow-lg ring-1 ring-black/5">
      {/* Image / banner area */}
      <div className="relative overflow-hidden rounded-lg">
        <div className={`placeholder ${compact ? "h-28" : "h-44"} w-full`}>
          Sunset View
        </div>

        {/* diagonal brand banner */}
        <div className="absolute left-0 top-3 flex w-full items-center justify-between bg-navy/85 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white">
          <span className="opacity-90">BiNuKBoK · VieW PoiNT ReSoRT</span>
          <span className="text-teal-bright">RESERVE YOUR SPOT NOW</span>
        </div>

        {/* big room name */}
        <div className="absolute inset-x-0 bottom-2 px-3 text-center">
          <p
            className={`font-extrabold uppercase leading-none text-navy drop-shadow ${
              compact ? "text-lg" : "text-2xl"
            }`}
            style={{ WebkitTextStroke: "0.5px rgba(255,255,255,0.6)" }}
          >
            {room.name}
          </p>
          <p className="mt-1 text-[10px] font-medium italic text-white drop-shadow">
            Experience unparalleled sunset view at {room.name}
          </p>
        </div>
      </div>

      {/* thumbnails */}
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`placeholder ${compact ? "h-9" : "h-12"} rounded`}>
            <span className="text-[8px]">Photo</span>
          </div>
        ))}
      </div>

      {/* book + price */}
      <div className="mt-3 flex items-center justify-between px-0.5 pb-1">
        <span className="rounded-full bg-navy px-4 py-1.5 text-[11px] font-semibold text-white">
          BOOK NOW
        </span>
        <span className="rounded-full bg-teal-deep px-3 py-1.5 text-[11px] font-bold text-white">
          ₱{room.price.toLocaleString()}/night
        </span>
      </div>
    </div>
  );
}
