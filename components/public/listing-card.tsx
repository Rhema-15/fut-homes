import Link from "next/link";
import type { PublicListing } from "@/lib/public-data";
import { BADGE_LABEL, badgeLevel } from "@/lib/agent-checks";
import {
  ROOM_TYPES,
  formatDistanceShort,
  formatDuration,
  formatNaira,
  genderNote,
  isPartial,
  photoUrl,
  rentMonths,
  rentUnit,
} from "@/lib/options";
import { AMENITIES } from "@/lib/amenities";

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
          {!taken && isPartial(listing.rent_months) && (
            <span className="rounded-full bg-error px-2 py-px text-xs leading-4 font-bold text-white">
              Only {rentMonths(listing.rent_months)} months
            </span>
          )}
          {level && (
            <span
              className={
                "rounded-full px-2 py-px text-xs leading-4 font-bold " +
                (level === "trusted" ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700")
              }
            >
              {BADGE_LABEL[level]}
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
          <span className="text-xs font-bold">{rentUnit(listing.rent_months)}{shared ? " · your share" : ""}{genderNote(listing.room_type, listing.roommate_gender)}</span>
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

// Search results card: wide photo on top, price sticker over its edge,
// facts and the first couple of "what's included" ticks below.
// Taken rooms fall back to the compact card (greyed) so they take less space.
export function LargeListingCard({ listing, index = 0 }: { listing: PublicListing; index?: number }) {
  if (listing.status === "taken") return <ListingCard listing={listing} index={index} />;
  const cover = listing.photos[0];
  const duration = listing.video_path ? formatDuration(listing.video_seconds) : null;
  const distance = formatDistanceShort(listing.distance_km, listing.campus);
  const level = badgeLevel(listing.agent);
  const sticker = STICKERS[index % STICKERS.length];
  const shared = listing.room_type === "shared";

  return (
    <Link href={`/rooms/${listing.id}`} className="sticker block overflow-hidden rounded-[22px] bg-white text-ink">
      <span className="relative block h-[190px] border-b-2 border-ink bg-brand-50">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(cover)}
            alt=""
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
        {listing.video_path && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sticker-yellow px-2.5 py-0.5 text-xs leading-5 font-extrabold">
            <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
            </svg>
            {duration ?? "Video"}
          </span>
        )}
        {listing.photos.length > 1 && (
          <span className="absolute top-2.5 right-2.5 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs leading-5 font-bold">
            {listing.photos.length} photos
          </span>
        )}
        <span
          className={
            "absolute right-3 -bottom-[18px] rounded-[12px] border-2 border-ink px-3 py-1 text-[20px] leading-6 font-extrabold " +
            sticker.bg +
            " " +
            sticker.tilt
          }
        >
          {formatNaira(listing.price)}
          <span className="text-xs font-bold">{rentUnit(listing.rent_months)}{shared ? " · your share" : ""}{genderNote(listing.room_type, listing.roommate_gender)}</span>
        </span>
      </span>
      <span className="flex flex-col gap-1 px-3.5 pt-3.5 pb-3.5">
        <span className="pr-28 text-[18px] leading-[22px] font-extrabold tracking-[-0.02em]">{ROOM_TYPES[listing.room_type]}</span>
        <span className="text-sm leading-[18px] font-medium text-muted">
          {[listing.area, distance ?? (listing.campus === "bosso" ? "Near Bosso" : "Near GK")].filter(Boolean).join(" · ")}
        </span>
        <span className="flex flex-wrap gap-1.5 pt-1">
          <span className="rounded-full bg-success-50 px-2 py-px text-xs leading-4 font-bold text-success">Available</span>
          {isPartial(listing.rent_months) && (
            <span className="rounded-full bg-error px-2 py-px text-xs leading-4 font-bold text-white">
              Only {rentMonths(listing.rent_months)} months
            </span>
          )}
          {level && (
            <span
              className={
                "rounded-full px-2 py-px text-xs leading-4 font-bold " +
                (level === "trusted" ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700")
              }
            >
              {BADGE_LABEL[level]}
            </span>
          )}
          {listing.amenities.slice(0, 2).map((a) => (
            <span key={a} className="rounded-full border-[1.5px] border-ink px-2 py-px text-xs leading-4 font-bold">
              {AMENITIES[a]}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}

export function ListingGrid({ listings, large = false }: { listings: PublicListing[]; large?: boolean }) {
  return (
    <div className={"grid grid-cols-1 min-[700px]:grid-cols-2 " + (large ? "gap-5" : "gap-3.5")}>
      {listings.map((l, i) =>
        large ? <LargeListingCard key={l.id} listing={l} index={i} /> : <ListingCard key={l.id} listing={l} index={i} />,
      )}
    </div>
  );
                                                        }
      
