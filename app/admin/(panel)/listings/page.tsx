import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CAMPUSES, ROOM_TYPES, type Campus, type RoomType, formatNaira, photoUrl } from "@/lib/options";

export const instant = false;
export const metadata: Metadata = { title: "Listings · FUT Homes admin", robots: { index: false } };

type Row = {
  id: string;
  title: string;
  room_type: RoomType;
  campus: Campus;
  area: string | null;
  price: number;
  status: "available" | "taken";
  video_path: string | null;
  agents: { name: string } | null;
  listing_photos: { path: string; position: number }[];
};

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, room_type, campus, area, price, status, video_path, agents(name), listing_photos(path, position)")
    .order("created_at", { ascending: false });
  const listings = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <Link href="/admin/listings/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Add listing
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">Couldn&apos;t load listings: {error.message}</p>}
      {!error && listings.length === 0 && <p className="mt-6 text-neutral-500">No listings yet.</p>}

      <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {listings.map((l) => {
          const cover = [...l.listing_photos].sort((a, b) => a.position - b.position)[0];
          return (
            <li key={l.id} className="flex gap-3 p-3">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(cover.path)} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="h-16 w-20 shrink-0 rounded-md bg-neutral-200" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.title}</p>
                <p className="text-sm text-neutral-500">
                  {ROOM_TYPES[l.room_type]} · {l.area ? `${l.area}, ` : ""}
                  {CAMPUSES[l.campus]}
                </p>
                <p className="text-sm">
                  {formatNaira(l.price)}/yr · <span className="text-neutral-500">{l.agents?.name}</span>
                  {l.video_path && <span className="ml-2 text-xs text-neutral-500">▶ video</span>}
                  {l.status === "taken" && <span className="ml-2 text-xs text-red-600">Taken</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
