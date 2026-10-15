import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CAMPUSES, ROOM_TYPES, type Campus, type RoomType, formatNaira, photoUrl } from "@/lib/options";
import { setListingStatus } from "./actions";

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
  is_published: boolean;
  agents: { name: string } | null;
  listing_photos: { path: string; position: number }[];
};

export default async function ListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const { agent } = await searchParams;
  const agentId = typeof agent === "string" && agent ? agent : null;
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select("id, title, room_type, campus, area, price, status, video_path, is_published, agents(name), listing_photos(path, position)")
    .order("created_at", { ascending: false });
  if (agentId) query = query.eq("agent_id", agentId);
  const [{ data, error }, { data: agentRows }] = await Promise.all([
    query,
    supabase.from("agents").select("id, name").order("name"),
  ]);
  const listings = (data ?? []) as unknown as Row[];
  const agents = agentRows ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <Link href="/admin/listings/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Add listing
        </Link>
      </div>

      {/* Pick an agent to see only their rooms (works without JavaScript). */}
      <form className="mt-4 flex gap-2">
        <select
          name="agent"
          defaultValue={agentId ?? ""}
          aria-label="Show rooms from"
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base"
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium">
          Show
        </button>
      </form>
      {agentId && (
        <p className="mt-2 text-sm text-neutral-600">
          {listings.length} room{listings.length === 1 ? "" : "s"} from {agents.find((a) => a.id === agentId)?.name ?? "this agent"}.{" "}
          <Link href="/admin/listings" className="underline">
            Show all
          </Link>
        </p>
      )}

      {error && <p className="mt-6 text-sm text-red-600">Couldn&apos;t load listings: {error.message}</p>}
      {!error && listings.length === 0 && (
        <p className="mt-6 text-neutral-500">{agentId ? "No rooms from this agent yet." : "No listings yet."}</p>
      )}

      <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {listings.map((l) => {
          const cover = [...l.listing_photos].sort((a, b) => a.position - b.position)[0];
          return (
            <li key={l.id} className="flex items-start gap-3 p-3">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(cover.path)} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="h-16 w-20 shrink-0 rounded-md bg-neutral-200" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/admin/listings/${l.id}`} className="block truncate font-medium hover:underline">
                  {l.title}
                </Link>
                <p className="text-sm text-neutral-500">
                  {ROOM_TYPES[l.room_type]} · {l.area ? `${l.area}, ` : ""}
                  {CAMPUSES[l.campus]}
                </p>
                <p className="text-sm">
                  {formatNaira(l.price)}/yr · <span className="text-neutral-500">{l.agents?.name}</span>
                  {l.video_path && <span className="ml-2 text-xs text-neutral-500">▶ video</span>}
                  {l.status === "taken" && <span className="ml-2 text-xs text-red-600">Taken</span>}
                  {!l.is_published && <span className="ml-2 text-xs text-red-600">Hidden</span>}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Link href={`/admin/listings/${l.id}`} className="text-sm underline">
                  Edit
                </Link>
                <form action={setListingStatus.bind(null, l.id, l.status === "taken" ? "available" : "taken", "/admin/listings")}>
                  <button type="submit" className="text-xs text-neutral-600 underline">
                    {l.status === "taken" ? "Mark available" : "Mark taken"}
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
