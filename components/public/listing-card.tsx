import Link from "next/link";
import type { PublicListing } from "@/lib/public-data";
import { ROOM_TYPES, firstName, listingCode, formatDistance, formatDuration, formatNaira, photoUrl } from "@/lib/options";
import AgentBadge from "./agent-badge";
import { Icon } from "./icons";

export default function ListingCard({ listing, eager = false }: { listing: PublicListing; eager?: boolean }) {
  const taken = listing.status === "taken";
  const cover = listing.photos[0];
  const duration = listing.video_path ? formatDuration(listing.video_seconds) : null;
  const distance = formatDistance(listing.distance_km, listing.campus);

  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <div className="relative aspect-[4/3] bg-brand-50">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(cover)}
            alt=""
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={"h-full w-full object-cover " + (taken ? "opacity-40 grayscale" : "")}
          />
        )}
        <span
          className={
            "absolute top-3 left-3 rounded-full px-2 py-1 text-xs leading-4 font-semibold " +
            (taken ? "bg-error text-white" : "bg-success-50 text-success")
          }
        >
          {taken ? "Taken" : "Available"}
        </span>
        {listing.video_path && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-scrim px-2 py-1 text-xs leading-4 font-semibold text-white">
            <Icon name="play" size={12} />
            {duration ?? "Video"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <p>
          <span className={"text-xl leading-6 font-extrabold " + (taken ? "text-muted line-through" : "")}>
            {formatNaira(listing.price)}
          </span>{" "}
          <span className="text-sm text-muted">/year</span>
        </p>
        <h3 className="text-lg leading-6 font-semibold">
          {/* The whole card is one tap target via this stretched link. */}
          <Link href={`/rooms/${listing.id}`} className="after:absolute after:inset-0 after:content-['']">
            {ROOM_TYPES[listing.room_type]}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          {listing.area && (
            <span className="inline-flex items-center gap-1">
              <Icon name="map-pin" size={16} />
              {listing.area}
            </span>
          )}
          {distance && (
            <span className="inline-flex items-center gap-1">
              <Icon name="navigation" size={16} />
              {distance}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm font-semibold">
          <AgentAvatar name={listing.agent.name} photo={listing.agent.photo_path} />
          {firstName(listing.agent.name)}
          {/* Sits above the stretched link so the badge stays tappable. */}
          <span className="relative z-10 ml-auto">
            <AgentBadge
              agentName={listing.agent.name}
              isTrusted={listing.agent.is_trusted}
              checkedOn={listing.agent.created_at}
              listingCode={listingCode(listing.id)}
            />
          </span>
        </div>
      </div>
    </article>
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
        className="flex-none rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex flex-none items-center justify-center rounded-full bg-brand-700 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size >= 40 ? 18 : 12 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function ListingGrid({ listings }: { listings: PublicListing[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[960px]:grid-cols-3">
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} eager={i === 0} />
      ))}
    </div>
  );
}
