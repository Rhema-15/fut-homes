import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AgentBadge from "@/components/public/agent-badge";
import Gallery from "@/components/public/gallery";
import ShareRoom from "@/components/public/share-room";
import { Icon } from "@/components/public/icons";
import { AgentAvatar, ListingGrid } from "@/components/public/listing-card";
import { SafetyWarning } from "@/components/public/site-chrome";
import {
  ROOM_TYPES,
  firstName,
  formatDistance,
  formatDuration,
  formatNaira,
  listingCode,
  photoUrl,
} from "@/lib/options";
import { getListing, similarListings } from "@/lib/public-data";
import { shareData } from "@/lib/share";
import { badgeLevel } from "@/lib/agent-checks";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const listing = await getListing((await params).id);
  if (!listing) return { title: "Room not found" };
  const title = `${ROOM_TYPES[listing.room_type]}${listing.area ? ` in ${listing.area}` : ""}, ${formatNaira(listing.price)}/year`;
  const description = `${listing.status === "taken" ? "Taken. " : ""}${listing.title}. On FUT Homes. Never pay before you inspect.`;
  return {
    title,
    description,
    // The cover photo shows up when the link is shared on WhatsApp.
    openGraph: { title, description, images: listing.photos[0] ? [photoUrl(listing.photos[0])] : [] },
  };
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  return `Listed ${days} days ago`;
}

export default async function ListingPage({ params }: PageProps<"/rooms/[id]">) {
  const listing = await getListing((await params).id);
  if (!listing) notFound();

  const taken = listing.status === "taken";
  const type = ROOM_TYPES[listing.room_type];
  const distance = formatDistance(listing.distance_km, listing.campus);
  const code = listingCode(listing.id);
  const similar = taken ? await similarListings(listing) : [];

  const message =
    `Hi, I found your room on FUT Homes: ${type}${listing.area ? ` in ${listing.area}` : ""}, ` +
    `${formatNaira(listing.price)}/year (Listing #${code}). Is it still available? I'd like to book an inspection.`;
  const whatsappHref = `https://wa.me/${listing.agent.whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <div className="mx-auto w-full max-w-3xl min-[768px]:px-4 min-[768px]:pt-6">
      <Gallery
        photos={listing.photos}
        title={listing.title}
        taken={taken}
        videoPath={listing.video_path}
        videoLabel={formatDuration(listing.video_seconds)}
        backHref={`/rooms?campus=${listing.campus}`}
        shareButton={taken ? undefined : <ShareRoom {...shareData({ ...listing, badge: badgeLevel(listing.agent) })} />}
      />

      <section className="flex flex-col gap-2 px-4 pt-5 min-[768px]:px-0">
        <span
          className={
            "self-start rounded-full px-2 py-1 text-xs leading-4 font-semibold " +
            (taken ? "bg-error text-white" : "bg-success-50 text-success")
          }
        >
          {taken ? "Taken" : "Available"}
        </span>
        <h1 className="text-[28px] leading-[34px] font-extrabold tracking-[-0.01em] min-[768px]:text-[34px] min-[768px]:leading-10">
          {listing.title}
        </h1>
        <p>
          <span className={"text-2xl leading-[30px] font-extrabold " + (taken ? "text-muted line-through" : "")}>
            {formatNaira(listing.price)}
          </span>{" "}
          <span className="text-sm text-muted">/year · {type}</span>
        </p>
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
      </section>

      {taken && (
        <section className="px-4 pt-6 min-[768px]:px-0">
          <p className="rounded-md bg-error-50 p-3 font-semibold text-error">
            This room has been taken. Here are similar rooms nearby.
          </p>
          {similar.length > 0 && (
            <div className="pt-4">
              <ListingGrid listings={similar} />
            </div>
          )}
        </section>
      )}

      {(listing.description || listing.fees_note) && (
        <section className="flex flex-col gap-2 px-4 pt-6 min-[768px]:px-0">
          <h2 className="text-lg leading-6 font-semibold">About this room</h2>
          {listing.description && <p className="whitespace-pre-line text-slate">{listing.description}</p>}
          {listing.fees_note && (
            <p className="text-sm text-slate">
              <span className="font-semibold text-ink">Other fees: </span>
              {listing.fees_note}
            </p>
          )}
        </section>
      )}

      <section className="px-4 pt-6 min-[768px]:px-0">
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            <AgentAvatar name={listing.agent.name} photo={listing.agent.photo_path} size={48} />
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold">{firstName(listing.agent.name)}</span>
              <AgentBadge agentName={listing.agent.name} checks={listing.agent} listingCode={code} />
            </div>
          </div>
          <p className="text-sm text-muted">
            {daysAgo(listing.created_at)} · Listing #{code}
          </p>
        </div>
      </section>

      <section className="px-4 pt-6 min-[768px]:px-0">
        <SafetyWarning />
      </section>

      <section className="px-4 pt-2 pb-8 min-[768px]:px-0">
        <Link
          href={`/report?listing=${encodeURIComponent("#" + code)}&agent=${encodeURIComponent(firstName(listing.agent.name))}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-error"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <path d="M4 22v-7" />
          </svg>
          Report this listing
        </Link>
      </section>

      {!taken && (
        <div className="sticky bottom-0 z-10 mt-auto flex items-center gap-3 border-t border-line bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] min-[768px]:rounded-t-lg min-[768px]:border-x">
          <div className="min-w-0 flex-1">
            <div className="text-xl leading-6 font-extrabold">{formatNaira(listing.price)}</div>
            <div className="text-xs leading-4 text-muted">per year</div>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[52px] flex-[0_0_60%] items-center justify-center gap-2 rounded-md bg-whatsapp px-3 text-[15px] font-semibold text-white active:bg-whatsapp-pressed"
          >
            {/* Placeholder until the official WhatsApp glyph is added. */}
            <Icon name="message-circle" size={20} />
            Book inspection
          </a>
        </div>
      )}

      {taken && (
        <div className="px-4 pb-8 min-[768px]:px-0">
          <Link
            href={`/rooms?campus=${listing.campus}`}
            className="flex h-12 items-center justify-center rounded-md bg-brand-700 font-semibold text-white active:bg-brand-900"
          >
            See available rooms
          </Link>
        </div>
      )}
    </div>
  );
}
