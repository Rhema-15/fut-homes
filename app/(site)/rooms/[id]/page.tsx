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
  CAMPUSES,
  ROOM_TYPES,
  firstName,
  genderNote,
  formatDuration,
  formatNaira,
  listingCode,
  confirmedAgo,
  photoUrl,
} from "@/lib/options";
import { type PublicListing, getListing, moreNearby, similarListings } from "@/lib/public-data";
import { AMENITIES } from "@/lib/amenities";
import { shareData, shortLink } from "@/lib/share";
import { badgeLevel } from "@/lib/agent-checks";
import { FUT_HOMES_WHATSAPP, whatsappLink } from "@/lib/contact";

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

function KeyFacts({ listing }: { listing: PublicListing }) {
  const campusShort = listing.campus === "bosso" ? "Bosso" : "GK";
  const facts = [
    { icon: "home" as const, value: ROOM_TYPES[listing.room_type], label: "Room type" },
    { icon: "map-pin" as const, value: listing.area ?? CAMPUSES[listing.campus], label: listing.area ? "Area" : "Near campus" },
    listing.distance_km !== null
      ? { icon: "navigation" as const, value: `${listing.distance_km.toFixed(1)} km`, label: `to ${campusShort} campus` }
      : { icon: "navigation" as const, value: campusShort, label: "Nearest campus" },
  ];
  return (
    <dl className="grid grid-cols-3 overflow-hidden rounded-lg border-2 border-ink bg-white">
      {facts.map((f, i) => (
        <div key={f.label} className={"flex min-w-0 flex-col gap-1 p-3 " + (i < 2 ? "border-r-2 border-ink" : "")}>
          <span className="text-brand-700">
            <Icon name={f.icon} size={20} />
          </span>
          <dd className="text-[15px] leading-5 font-extrabold break-words">{f.value}</dd>
          <dt className="order-last text-xs leading-4 font-semibold text-muted">{f.label}</dt>
        </div>
      ))}
    </dl>
  );
}

function Fees({ listing }: { listing: PublicListing }) {
  const rows = [
    { label: listing.room_type === "shared" ? "Your share of rent (1 year)" : "Rent (1 year)", amount: listing.price },
    listing.agent_fee !== null ? { label: "Agent fee", amount: listing.agent_fee } : null,
    listing.caution_fee !== null ? { label: "Caution fee", amount: listing.caution_fee } : null,
  ].filter((r) => r !== null);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  if (rows.length < 2 && !listing.fees_note) return null;
  return (
    <div className="flex flex-col gap-1.5 rounded-md border-2 border-ink bg-white px-3.5 py-3 text-sm font-semibold">
      {rows.length > 1 &&
        rows.map((r) => (
          <p key={r.label} className="flex justify-between gap-3">
            <span>{r.label}</span>
            <span className="font-extrabold">{formatNaira(r.amount)}</span>
          </p>
        ))}
      {rows.length > 1 && (
        <p className="mt-0.5 flex justify-between gap-3 border-t-2 border-dashed border-ink pt-2 text-[15px] font-extrabold">
          <span>Total to move in</span>
          <span>{formatNaira(total)}</span>
        </p>
      )}
      {listing.fees_note && (
        <p className={"font-medium text-slate " + (rows.length > 1 ? "pt-1" : "")}>
          <span className="font-bold text-ink">{rows.length > 1 ? "Also: " : "Other fees: "}</span>
          {listing.fees_note}
        </p>
      )}
    </div>
  );
}

function MiniCard({ listing }: { listing: PublicListing }) {
  const cover = listing.photos[0];
  const short = listing.distance_km !== null ? `${listing.distance_km.toFixed(1)} km` : listing.area;
  return (
    <Link
      href={`/rooms/${listing.id}`}
      className="sticker flex w-40 flex-none flex-col overflow-hidden rounded-lg bg-white text-ink"
    >
      <span className="block h-[100px] border-b-2 border-ink bg-brand-50">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(cover)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        )}
      </span>
      <span className="flex flex-col gap-0.5 px-2.5 py-2">
        <span className="text-[15px] leading-5 font-extrabold">{formatNaira(listing.price)}</span>
        <span className="truncate text-xs leading-4 font-semibold text-muted">
          {[listing.room_type === "shared" ? {`Shared · your share${genderNote(listing.room_type, listing.roommate_gender)}`} : ROOM_TYPES[listing.room_type], short]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </Link>
  );
}

export default async function ListingPage({ params }: PageProps<"/rooms/[id]">) {
  const listing = await getListing((await params).id);
  if (!listing) notFound();

  const taken = listing.status === "taken";
  const type = ROOM_TYPES[listing.room_type];
  const code = listingCode(listing.id);
  const similar = taken ? await similarListings(listing) : [];
  const more = taken ? null : await moreNearby(listing);
  const moreHref = more?.area && !more.label.includes(" near ")
    ? `/rooms?where=${encodeURIComponent("area:" + more.area)}`
    : `/rooms?where=${listing.campus}`;

    const message =
    `Hi FUT Homes, I want to book an inspection: ${type}${genderNote(listing.room_type, listing.roommate_gender)}${listing.area ? ` in ${listing.area}` : ""}, ` +
    `${formatNaira(listing.price)}/year (Listing #${code}, agent ${firstName(listing.agent.name)}).\n\n` +
    `https://${shortLink(listing.id)}`;
  const whatsappHref = whatsappLink(FUT_HOMES_WHATSAPP, message);

  return (
    <div className="mx-auto w-full max-w-3xl min-[768px]:px-4 min-[768px]:pt-6">
      <Gallery
        photos={listing.photos}
        title={listing.title}
        taken={taken}
        videoPath={listing.video_path}
        videoLabel={formatDuration(listing.video_seconds)}
        backHref={`/rooms?where=${listing.campus}`}
        shareButton={taken ? undefined : <ShareRoom {...shareData({ ...listing, badge: badgeLevel(listing.agent) })} />}
      />

      <section className="flex flex-col gap-2 px-[18px] pt-5 min-[768px]:px-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              "rounded-full px-2.5 py-1 text-xs leading-4 font-bold " +
              (taken ? "bg-error text-white" : "bg-success-50 text-success")
            }
          >
            {taken ? "Taken" : "Available"}
          </span>
          {!taken && listing.confirmed_at && (
            <span className="text-sm font-medium text-muted">{confirmedAgo(listing.confirmed_at)}</span>
          )}
        </div>
        <h1 className="text-[30px] leading-[34px] font-extrabold tracking-[-0.03em] min-[768px]:text-[40px] min-[768px]:leading-[44px]">
          {listing.title}
        </h1>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={
              "-rotate-2 rounded-[12px] border-2 border-ink bg-sticker-yellow px-3 py-1 text-[24px] leading-[30px] font-extrabold " +
              (taken ? "line-through" : "")
            }
          >
            {formatNaira(listing.price)}
            <span className="text-sm font-bold">/year</span>
          </span>
          {listing.room_type === "shared" && <span className="text-sm font-bold text-muted">Price is your share</span>}
        </p>
      </section>

      <section className="px-[18px] pt-4 min-[768px]:px-0">
        <KeyFacts listing={listing} />
      </section>

      {taken && (
        <section className="px-[18px] pt-6 min-[768px]:px-0">
          <p className="rounded-md border-2 border-ink bg-error-50 p-3 font-bold text-error">
            This room has been taken. Here are similar rooms nearby.
          </p>
          {similar.length > 0 && (
            <div className="pt-4">
              <ListingGrid listings={similar} />
            </div>
          )}
        </section>
      )}

      {listing.amenities.length > 0 && (
        <section className="flex flex-col gap-2.5 px-[18px] pt-6 min-[768px]:px-0">
          <h2 className="text-[20px] leading-6 font-extrabold tracking-[-0.02em]">What&apos;s included</h2>
          <ul className="grid grid-cols-2 gap-2">
            {listing.amenities.map((a) => (
              <li
                key={a}
                className="flex items-center gap-2 rounded-md border-2 border-ink bg-white px-3 py-2.5 text-sm leading-[18px] font-bold"
              >
                <span className="flex size-[22px] flex-none items-center justify-center rounded-full border-2 border-ink bg-sticker-mint">
                  <Icon name="check" size={12} />
                </span>
                {AMENITIES[a]}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(listing.description || listing.fees_note || listing.agent_fee !== null || listing.caution_fee !== null) && (
        <section className="flex flex-col gap-2.5 px-[18px] pt-6 min-[768px]:px-0">
          <h2 className="text-[20px] leading-6 font-extrabold tracking-[-0.02em]">About this room</h2>
          {listing.description && <p className="whitespace-pre-line font-medium text-slate">{listing.description}</p>}
          <Fees listing={listing} />
        </section>
      )}

      <section className="px-[18px] pt-6 min-[768px]:px-0">
        <div className="sticker flex flex-col gap-3 rounded-lg bg-white p-4">
          <div className="flex items-center gap-3">
            <AgentAvatar name={listing.agent.name} photo={listing.agent.photo_path} size={48} />
            <div className="flex flex-col items-start gap-1">
              <span className="text-lg leading-6 font-extrabold">{firstName(listing.agent.name)}</span>
              <AgentBadge agentName={listing.agent.name} checks={{ long_time_poster: listing.agent.long_time_poster, still_posting: listing.agent.still_posting, students_confirmed: listing.agent.students_confirmed }} listingCode={code} />

            </div>
          </div>
          <p className="text-sm font-medium text-muted">
            {daysAgo(listing.created_at)} · Listing #{code}
          </p>
        </div>
      </section>

      <section className="px-[18px] pt-6 min-[768px]:px-0">
        <SafetyWarning />
      </section>

      {more && more.rooms.length > 0 && (
        <section className="flex flex-col gap-2.5 pt-7">
          <div className="flex items-baseline justify-between gap-3 px-[18px] min-[768px]:px-0">
            <h2 className="text-[20px] leading-6 font-extrabold tracking-[-0.02em]">{more.label}</h2>
            <Link href={moreHref} className="flex-none text-sm font-bold text-brand-700">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-[18px] pt-0.5 pb-2 min-[768px]:px-0">
            {more.rooms.map((r) => (
              <MiniCard key={r.id} listing={r} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col items-start px-[18px] pt-4 pb-8 min-[768px]:px-0">
        {!taken && (
          <Link
            href={`/report?reason=taken&listing=${encodeURIComponent("#" + code)}&agent=${encodeURIComponent(firstName(listing.agent.name))}`}
            className="inline-flex min-h-11 items-center text-sm font-bold text-brand-700 underline underline-offset-4"
          >
            Already taken? Tell us
          </Link>
        )}
        <Link
          href={`/report?listing=${encodeURIComponent("#" + code)}&agent=${encodeURIComponent(firstName(listing.agent.name))}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-error"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <path d="M4 22v-7" />
          </svg>
          Report this listing
        </Link>
      </section>

      {!taken && (
        <div className="sticky bottom-0 z-10 mt-auto flex items-center gap-3 border-t-2 border-ink bg-white px-[18px] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] min-[768px]:rounded-t-lg min-[768px]:border-x-2">
          <div className="min-w-0 flex-1">
            <div className="text-xl leading-6 font-extrabold">{formatNaira(listing.price)}</div>
            <div className="text-xs leading-4 font-medium text-muted">per year</div>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="sticker flex h-[52px] flex-[0_0_60%] items-center justify-center gap-2 rounded-md bg-whatsapp px-3 text-[16px] font-extrabold text-white"
          >
            {/* Placeholder until the official WhatsApp glyph is added. */}
            <Icon name="message-circle" size={20} />
            Book inspection
          </a>
        </div>
      )}

      {taken && (
        <div className="px-[18px] pb-8 min-[768px]:px-0">
          <Link
            href={`/rooms?where=${listing.campus}`}
            className="sticker flex h-12 items-center justify-center rounded-md bg-brand-700 font-extrabold text-white"
          >
            See available rooms
          </Link>
        </div>
      )}
    </div>
  );
}
