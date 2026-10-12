import "server-only";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { CAMPUSES, ROOM_TYPES, type Campus, type RoomType, isOneOf } from "@/lib/options";

// Public pages read with the anon key, no cookies. Row Level Security
// only lets them see published listings of active agents.
function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PublicAgent = {
  id: string;
  name: string;
  whatsapp: string;
  photo_path: string | null;
  is_trusted: boolean;
  created_at: string;
};

export type PublicListing = {
  id: string;
  title: string;
  room_type: RoomType;
  campus: Campus;
  area: string | null;
  distance_km: number | null;
  price: number;
  fees_note: string | null;
  description: string | null;
  status: "available" | "taken";
  video_path: string | null;
  video_seconds: number | null;
  created_at: string;
  agent: PublicAgent;
  photos: string[];
};

const SELECT =
  "id, title, room_type, campus, area, distance_km, price, fees_note, description, status, video_path, video_seconds, created_at, " +
  "agents!inner(id, name, whatsapp, photo_path, is_trusted, created_at), listing_photos(path, position)";

type Row = Omit<PublicListing, "agent" | "photos"> & {
  agents: PublicAgent;
  listing_photos: { path: string; position: number }[];
};

function shape(row: Row): PublicListing {
  const { agents, listing_photos, ...rest } = row;
  return {
    ...rest,
    distance_km: rest.distance_km === null ? null : Number(rest.distance_km),
    agent: agents,
    photos: [...listing_photos].sort((a, b) => a.position - b.position).map((p) => p.path),
  };
}

import { SORTS, type Sort } from "@/lib/sorts";
export { SORTS, type Sort };

export const BUDGETS = [150000, 200000, 250000, 350000, 500000] as const;

export type Filters = {
  campus: Campus | null;
  type: RoomType | null;
  max: number | null;
  sort: Sort;
};

export function readFilters(params: Record<string, string | string[] | undefined>): Filters {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
  };
  const campus = one("campus");
  const type = one("type");
  const max = Number(one("max"));
  const sort = one("sort");
  return {
    campus: isOneOf(CAMPUSES, campus) ? campus : null,
    type: isOneOf(ROOM_TYPES, type) ? type : null,
    max: Number.isFinite(max) && max > 0 ? max : null,
    sort: isOneOf(SORTS, sort) ? sort : "near",
  };
}

export function filtersToQuery(filters: Partial<Filters>): string {
  const q = new URLSearchParams();
  if (filters.campus) q.set("campus", filters.campus);
  if (filters.type) q.set("type", filters.type);
  if (filters.max) q.set("max", String(filters.max));
  if (filters.sort && filters.sort !== "near") q.set("sort", filters.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function searchListings(filters: Filters, limit = 60): Promise<PublicListing[]> {
  await connection();
  let query = publicClient().from("listings").select(SELECT).eq("agents.is_active", true);
  if (filters.campus) query = query.eq("campus", filters.campus);
  if (filters.type) query = query.eq("room_type", filters.type);
  if (filters.max) query = query.lte("price", filters.max);

  // Taken rooms stay visible (greyed out) for 7 days, then drop off.
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  query = query.or(`status.eq.available,taken_at.gt.${weekAgo}`);

  // Taken rooms always go to the bottom.
  query = query.order("status", { ascending: true });
  if (filters.sort === "price") query = query.order("price", { ascending: true });
  else if (filters.sort === "new") query = query.order("created_at", { ascending: false });
  else query = query.order("distance_km", { ascending: true, nullsFirst: false }).order("price", { ascending: true });

  const { data, error } = await query.limit(limit);
  if (error) throw new Error(`Couldn't load rooms: ${error.message}`);
  return (data as unknown as Row[]).map(shape);
}

export async function newestListings(limit = 4): Promise<PublicListing[]> {
  await connection();
  const { data, error } = await publicClient()
    .from("listings")
    .select(SELECT)
    .eq("agents.is_active", true)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load rooms: ${error.message}`);
  return (data as unknown as Row[]).map(shape);
}

export async function getListing(id: string): Promise<PublicListing | null> {
  await connection();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await publicClient()
    .from("listings")
    .select(SELECT)
    .eq("id", id)
    .eq("agents.is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the room: ${error.message}`);
  return data ? shape(data as unknown as Row) : null;
}

export async function similarListings(listing: PublicListing, limit = 3): Promise<PublicListing[]> {
  const rooms = await searchListings({ campus: listing.campus, type: null, max: null, sort: "near" }, 12);
  return rooms.filter((r) => r.id !== listing.id && r.status === "available").slice(0, limit);
}
