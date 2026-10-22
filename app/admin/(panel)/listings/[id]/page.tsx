import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/confirm-button";
import ShareRoom from "@/components/public/share-room";
import { shareData } from "@/lib/share";
import { type AgentChecks, badgeLevel } from "@/lib/agent-checks";
import { createClient } from "@/lib/supabase/server";
import { confirmedAgo, listingCode } from "@/lib/options";
import { confirmListing, deleteListing, setListingPublished, setListingStatus, updateListing } from "../actions";
import ListingForm from "../listing-form";
import { knownAreas } from "@/lib/admin-areas";
import { missingDetails } from "@/lib/listing-state";

export const instant = false;
export const metadata: Metadata = { title: "Edit listing · FUT Homes admin", robots: { index: false } };

// The SQL 007 fields are read separately: before that SQL is run the
// query just fails and the form shows them empty.
type Extras = { amenities?: string[] | null; agent_fee?: number | null; caution_fee?: number | null; admin_note?: string | null; roommate_gender?: string | null };
async function loadExtras(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<Extras> {
  for (const cols of ["amenities, agent_fee, caution_fee, roommate_gender, admin_note","amenities, agent_fee, caution_fee, admin_note", "amenities, agent_fee, caution_fee", "admin_note"]) {
    const { data, error } = await supabase.from("listings").select(cols).eq("id", id).maybeSingle();
    if (!error) return (data ?? {}) as Extras;
  }
  return {};
}

export default async function EditListingPage({ params, searchParams }: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  const { missing: cantShow } = await searchParams;
  const supabase = await createClient();
  const [{ data: listing }, { data: agents }, extras] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, agent_id, title, room_type, campus, area, distance_km, price, fees_note, description, video_path, video_seconds, status, is_published, confirmed_at, agents(long_time_poster, still_posting, students_confirmed), listing_photos(path, position)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("agents").select("id, name").order("name"),
    loadExtras(supabase, id),
  ]);
  if (!listing) notFound();
  const areas = await knownAreas();

  const photos = [...(listing.listing_photos as { path: string; position: number }[])]
    .sort((a, b) => a.position - b.position)
    .map((p) => p.path);
  const taken = listing.status === "taken";
  const missing = missingDetails({ ...listing, photoCount: photos.length });

  return (
    <div className="max-w-md">
      <Link href="/admin/listings" className="text-sm text-neutral-500 hover:underline">
        ← Listings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Edit listing</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Listing #{listingCode(listing.id)} ·{" "}
        <Link href={`/rooms/${listing.id}`} className="underline" target="_blank">
          View on site
        </Link>
      </p>

      {!taken && listing.confirmed_at && (
        <p className="mt-4 text-sm text-neutral-600">{confirmedAgo(listing.confirmed_at)}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!taken && (
          <form action={confirmListing.bind(null, listing.id, `/admin/listings/${listing.id}`)}>
            <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium">
              Confirmed available today
            </button>
          </form>
        )}
        <form action={setListingStatus.bind(null, listing.id, taken ? "available" : "taken", `/admin/listings/${listing.id}`)}>
          <button
            type="submit"
            className={
              "rounded-md px-3 py-2 text-sm font-medium " +
              (taken ? "border border-neutral-300" : "bg-red-700 text-white")
            }
          >
            {taken ? "Mark as available again" : "Mark as taken"}
          </button>
        </form>
        {!listing.is_published && (
          <form action={setListingPublished.bind(null, listing.id, true)}>
            <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium">
              Show on site
            </button>
          </form>
        )}
      </div>
      {listing.is_published && (
        <form action={setListingPublished.bind(null, listing.id, false)} className="mt-3 flex gap-2">
          <input
            name="admin_note"
            aria-label="Why are you hiding it?"
            placeholder="Why hide it? e.g. agent not answering"
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium">
            Hide from site
          </button>
        </form>
      )}
      {typeof cantShow === "string" && cantShow && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Can&apos;t show it yet. Fill in: {cantShow}. Then save and tap Show on site.
        </p>
      )}
      {!taken && missing.length === 0 && (
        <div className="mt-4">
          <ShareRoom
            variant="button"
            {...shareData({
              id: listing.id,
              room_type: listing.room_type,
              campus: listing.campus,
              area: listing.area,
              distance_km: listing.distance_km === null ? null : Number(listing.distance_km),
              price: listing.price,
              video_path: listing.video_path,
              photos,
              badge: (() => {
                const a = listing.agents as unknown as AgentChecks | null;
                return a ? badgeLevel(a) : null;
              })(),
            })}
          />
        </div>
      )}

      {!listing.is_published && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">Hidden: students can&apos;t see this listing.</p>
          <p>Why: {extras.admin_note || "no reason noted"}</p>
          {missing.length > 0 && <p>Missing: {missing.join(", ")}</p>}
        </div>
      )}

      <ListingForm
        agents={agents ?? []}
        areas={areas}
        action={updateListing.bind(null, listing.id)}
        submitLabel="Save changes"
        listing={{
          agent_id: listing.agent_id,
          title: listing.title,
          room_type: listing.room_type,
          campus: listing.campus,
          area: listing.area,
          distance_km: listing.distance_km === null ? null : Number(listing.distance_km),
          price: listing.price,
          fees_note: listing.fees_note,
          agent_fee: extras.agent_fee ?? null,
          caution_fee: extras.caution_fee ?? null,
          roommate_gender: extras.roommate_gender ?? null,
          amenities: extras.amenities ?? [],
          description: listing.description,
          video_path: listing.video_path,
          video_seconds: listing.video_seconds,
          photos,
          admin_note: extras.admin_note ?? null,
        }}
      />

      <form action={deleteListing.bind(null, listing.id)} className="mt-10 border-t border-neutral-200 pt-6">
        <ConfirmButton
          message="Delete this listing and its photos for good? This can't be undone."
          className="text-sm font-medium text-red-700 hover:underline"
        >
          Delete listing
        </ConfirmButton>
      </form>
    </div>
  );
}
