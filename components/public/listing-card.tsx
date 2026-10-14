import Link from "next/link";
import type { PublicListing } from "@/lib/public-data";
import { badgeLevel } from "@/lib/agent-checks";
import { ROOM_TYPES, formatDistanceShort, formatDuration, formatNaira, photoUrl } from "@/lib/options";

// Price stickers rotate through the sticker colours so a list of rooms
// doesn't look like a spreadsheet.
const STICKERS = [
  { bg: "bg-sticker-yellow", tilt: "-rotate-2" },
  { bg: "bg-sticker-pink", tilt: "rotate-2" },
  { bg: "bg-sticker-mint", tilt: "-rotate-1" },
];

// Compact card: small photo left, the facts right. Three fit on a phone
// screen. The whole card is one tap target.
export default function ListingCard({ listing, index = 0 }: { listing: PublicListing; index?: number }) {
  const taken = listing.status === "taken";
  const cover = listing.photos[0];
  const duration = listing.video_path ? formatDuration(listing.video_seconds) : null;
  const distance = formatDistanceShort(listing.distance_km, listing.campus);
  const level = badgeLevel(listing.agent);
  const sticker = STICKERS[index % STICKERS.length];
  const shared = listing.room_type === "shared";

  return (
    <Link
      href={`/rooms/${listing.id}`}
      className={"sticker flex gap-3 rounded-lg bg-white p-2.5 text-ink " + (taken ? "opacity-70" : "")}
    >
      <span className="relative h-24 w-24 flex-none overflow-hidden rounded-md bg-brand-50">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(cover)}
            alt=""
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
            className={"h-full w-full object-cover " + (taken ? "grayscale" : "")}
          />
        )}
        {listing.video_path && !taken && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-ink px-1.5 py-0.5 text-[11px] leading-4 font-bold text-white">
            <svg width="9" height="9" viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
            </svg>
            {duration ?? "Video"}
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <span className="truncate text-[17px] leading-[21px] font-extrabold tracking-[-0.02em]">
          {ROOM_TYPES[listing.room_type]}
        </span>
        <span className="truncate text-sm leading-[18px] font-medium text-muted">
          {[listing.area, distance ?? (listing.campus === "bosso" ? "Near Bosso" : "Near GK")].filter(Boolean).join(" · ")}
        </span>
        <span className="mt-0.5 flex flex-wrap gap-1.5">
          <span
            className={
              "rounded-full px-2 py-px text-xs leading-4 font-bold " +
              (taken ? "bg-error text-white" : "bg-success-50 text-success")
            }
          >
            {taken ? "Taken" : "Available"}
          </span>
          {level && (
            <span
              className={
                "rounded-full px-2 py-px text-xs leading-4 font-bold " +
                (level === "trusted" ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700")
              }
            >
              {level === "trusted" ? "Trusted agent" : "Verified agent"}
            </span>
          )}
        </span>
        <span
          className={
            "mt-1.5 self-start rounded-[10px] border-2 border-ink px-2.5 py-0.5 text-base leading-5 font-extrabold " +
            sticker.bg +
            " " +
            sticker.tilt +
            (taken ? " line-through" : "")
          }
        >
          {formatNaira(listing.price)}
          <span className="text-xs font-bold">/yr{shared ? " · your share" : ""}</span>
        </span>
      </span>
    </Link>
  );
}

export function AgentAvatar({ name, photo, size = 24 }: { name: string; photo: string | null; size?: number }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl(photo)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="flex-none rounded-full border-2 border-ink object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex flex-none items-center justify-center rounded-full border-2 border-ink bg-sticker-yellow font-extrabold text-ink"
      style={{ width: size, height: size, fontSize: size >= 40 ? 18 : 12 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function ListingGrid({ listings }: { listings: PublicListing[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 min-[700px]:grid-cols-2">
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} index={i} />
      ))}
    </div>
  );
}
