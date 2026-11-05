import "server-only";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { CAMPUSES, ROOM_TYPES, type Campus, type RoomType, isOneOf } from "@/lib/options";
import { BUDGETS } from "@/lib/options";
import { LOCATIONS, isLocation } from "@/lib/locations";
import { cleanAmenities, type Amenity } from "@/lib/amenities";

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
  long_time_poster: boolean;
  still_posting: boolean;
  students_confirmed: boolean;
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
  agent_fee: number | null;
  caution_fee: number | null;
  roommate_gender: string | null;
  rent_months: number | null;
  location: string | null;
  amenities: Amenity[];
  description: string | null;
  status: "available" | "taken";
  video_path: string | null;
  video_seconds: number | null;
  created_at: string;
  confirmed_at: string | null;
  agent: PublicAgent;
  photos: string[];
};

const LISTING_COLS =
  "id, title, room_type, campus, area, distance_km, price, fees_note, description, status, video_path, video_seconds, created_at, ";
const AGENT_AND_PHOTOS =
  "agents!inner(id, name, whatsapp, photo_path, is_trusted, long_time_poster, still_posting, students_confirmed, created_at), listing_photos(path, position)";
// Newest columns first. If a SQL file hasn't been run yet, Postgres says
// "column missing" (42703) and we retry with the older column set, so the
// site keeps working (without that feature) until the SQL is run.
const SELECTS: [select: string, hasConfirmed: boolean][] = [
  [LISTING_COLS + "confirmed_at, amenities, agent_fee, caution_fee, roommate_gender, rent_months, location, " + AGENT_AND_PHOTOS, true], // SQL 011
  [LISTING_COLS + "confirmed_at, amenities, agent_fee, caution_fee, roommate_gender, rent_months, " + AGENT_AND_PHOTOS, true], // SQL 010
  [LISTING_COLS + "confirmed_at, amenities, agent_fee, caution_fee, roommate_gender, " + AGENT_AND_PHOTOS, true], // SQL 009
  [LISTING_COLS + "confirmed_at, amenities, agent_fee, caution_fee, " + AGENT_AND_PHOTOS, true], // SQL 007
  [LISTING_COLS + "confirmed_at, " + AGENT_AND_PHOTOS, true], // SQL 006
  [LISTING_COLS + AGENT_AND_PHOTOS, false],
];

type Result<T> = PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>;

async function withFallback<T>(build: (select: string, hasConfirmed: boolean) => Result<T>) {
  let result = await build(...SELECTS[0]);
  for (const [select, hasConfirmed] of SELECTS.slice(1)) {
    if (result.error?.code !== "42703") break;
    result = await build(select, hasConfirmed);
  }
  return result;
}

// Rooms hide from search once they haven't been confirmed for this long.
export const HIDE_AFTER_DAYS = 14;
// Admin is asked to re-check rooms after this long.
export const CHECK_AFTER_DAYS = 7;

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// Available and recently confirmed, or taken in the last 7 days.
function visibleFilter(hasConfirmed: boolean) {
  const taken = `taken_at.gt."${daysAgoIso(7)}"`;
  return hasConfirmed
    ? `and(status.eq.available,confirmed_at.gt."${daysAgoIso(HIDE_AFTER_DAYS)}"),${taken}`
    : `status.eq.available,${taken}`;
}


type Row = Omit<PublicListing, "agent" | "photos" | "confirmed_at" | "amenities" | "agent_fee" | "caution_fee" | "roommate_gender" | "rent_months" | "location"> & {
  confirmed_at?: string | null;
  amenities?: unknown;
  agent_fee?: number | null;
  caution_fee?: number | null;
  roommate_gender?: string | null;
  rent_months?: number | null;
  location?: string | null;
  agents: Omit<PublicAgent, "long_time_poster" | "still_posting" | "students_confirmed"> &
    Partial<Pick<PublicAgent, "long_time_poster" | "still_posting" | "students_confirmed">>;
  listing_photos: { path: string; position: number }[];
};

function shape(row: Row): PublicListing {
  const { agents, listing_photos, ...rest } = row;
  return {
    ...rest,
    confirmed_at: rest.confirmed_at ?? null,
    amenities: cleanAmenities(rest.amenities),
    agent_fee: rest.agent_fee ?? null,
    caution_fee: rest.caution_fee ?? null,
    roommate_gender: rest.roommate_gender ?? null,
    rent_months: rest.rent_months ?? null,
    location: rest.location ?? null,
    distance_km: rest.distance_km === null ? null : Number(rest.distance_km),
    agent: {
      ...agents,
      long_time_poster: agents.long_time_poster ?? false,
      still_posting: agents.still_posting ?? false,
      students_confirmed: agents.students_confirmed ?? agents.is_trusted,
    },
    photos: [...listing_photos].sort((a, b) => a.position - b.position).map((p) => p.path),
  };
}

import { SORTS, type Sort } from "@/lib/sorts";
export { SORTS, type Sort };

export { BUDGETS };

export type Filters = {
  location?: string | null;
  campus: Campus | null;
  area: string | null;
  type: RoomType | null;
  max: number | null;
  sort: Sort;
};

export function readFilters(params: Record<string, string | string[] | undefined>): Filters {
  const one = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
  };
  // "where" is a top location (gk, dama, ...). Old links used where=bosso,
  // where=gidan_kwano or where=area:<name>, and still work.
  const where = one("where");
  let location = where && !where.startsWith("area:") ? where : one("location");
  if (location === "gidan_kwano") location = "gk";
  const campus = one("campus");
  const area = (where.startsWith("area:") ? where.slice(5) : one("area")).trim().slice(0, 60);
  const type = one("type");
  const max = Number(one("max"));
  const sort = one("sort");
  return {
    location: isLocation(location) ? location : null,
    campus: isOneOf(CAMPUSES, campus) ? campus : null,
    area: area || null,
    type: isOneOf(ROOM_TYPES, type) ? type : null,
    max: Number.isFinite(max) && max > 0 ? max : null,
    sort: isOneOf(SORTS, sort) ? sort : "near",
  };
}

export function filtersToQuery(filters: Partial<Filters>): string {
  const q = new URLSearchParams();
  if (filters.location) q.set("where", filters.location);
  if (filters.area) q.set("area", filters.area);
  else if (!filters.location && filters.campus) q.set("campus", filters.campus);
  if (filters.type) q.set("type", filters.type);
  if (filters.max) q.set("max", String(filters.max));
  if (filters.sort && filters.sort !== "near") q.set("sort", filters.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function searchListings(filters: Filters, limit = 60): Promise<PublicListing[]> {
  await connection();
  const run = (useLocation: boolean) =>
    withFallback<Row[]>((select, hasConfirmed) => {
      let query = publicClient().from("listings").select(select).eq("agents.is_active", true);
      if (filters.location && isLocation(filters.location)) {
        if (useLocation) query = query.eq("location", filters.location);
        // Before SQL 011 is run there is no location column: use what we have.
        else if (filters.location === "gk") query = query.eq("campus", "gidan_kwano");
        else if (filters.location === "bosso") query = query.eq("campus", "bosso");
        else query = query.ilike("area", LOCATIONS[filters.location].label.replace(/[%_]/g, ""));
      }
      if (filters.campus) query = query.eq("campus", filters.campus);
      if (filters.area) query = query.ilike("area", filters.area.replace(/[%_]/g, ""));
      if (filters.type) query = query.eq("room_type", filters.type);
      if (filters.max) query = query.lte("price", filters.max);

      // Taken rooms stay visible (greyed out) for 7 days, then drop off.
      // Rooms not confirmed for 14 days hide until Rhema confirms them.
      query = query.or(visibleFilter(hasConfirmed));

      // Taken rooms always go to the bottom.
      query = query.order("status", { ascending: true });
      if (filters.sort === "price") query = query.order("price", { ascending: true });
      else if (filters.sort === "new") query = query.order("created_at", { ascending: false });
      else query = query.order("distance_km", { ascending: true, nullsFirst: false }).order("price", { ascending: true });

      return query.limit(limit) as unknown as Result<Row[]>;
    });
  let { data, error } = await run(true);
  if (error?.code === "42703" && filters.location) ({ data, error } = await run(false));
  if (error) throw new Error(`Couldn't load rooms: ${error.message}`);
  return (data ?? []).map(shape);
}

export async function newestListings(limit = 4): Promise<PublicListing[]> {
  await connection();
  const { data, error } = await withFallback<Row[]>((select, hasConfirmed) => {
    let query = publicClient()
      .from("listings")
      .select(select)
      .eq("agents.is_active", true)
      .eq("status", "available");
    if (hasConfirmed) query = query.gt("confirmed_at", daysAgoIso(HIDE_AFTER_DAYS));
    return query.order("created_at", { ascending: false }).limit(limit) as unknown as Result<Row[]>;
  });
  if (error) throw new Error(`Couldn't load rooms: ${error.message}`);
  return (data ?? []).map(shape);
}

export async function getListing(id: string): Promise<PublicListing | null> {
  await connection();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await withFallback<Row[]>(
    (select) =>
      publicClient()
        .from("listings")
        .select(select)
        .eq("id", id)
        .eq("agents.is_active", true)
        .limit(1) as unknown as Result<Row[]>,
  );
  if (error) throw new Error(`Couldn't load the room: ${error.message}`);
  return data?.[0] ? shape(data[0]) : null;
}

export async function similarListings(listing: PublicListing, limit = 3): Promise<PublicListing[]> {
  const rooms = await searchListings({ campus: listing.campus, area: null, type: null, max: null, sort: "near" }, 12);
  return rooms.filter((r) => r.id !== listing.id && r.status === "available").slice(0, limit);
}

// "More rooms in Dama": same area first, topped up with rooms near the
// same campus when the area has only a few.
export async function moreNearby(
  listing: PublicListing,
  limit = 6,
): Promise<{ label: string; area: string | null; rooms: PublicListing[] }> {
  const base = { campus: null, area: null, type: null, max: null, sort: "near" as const };
  const sameArea = listing.area ? await searchListings({ ...base, area: listing.area }, limit + 1) : [];
  const picked = sameArea.filter((r) => r.id !== listing.id && r.status === "available");
  if (picked.length < limit) {
    const near = await searchListings({ ...base, campus: listing.campus }, 20);
    for (const r of near) {
      if (picked.length >= limit) break;
      if (r.id !== listing.id && r.status === "available" && !picked.some((p) => p.id === r.id)) picked.push(r);
    }
  }
  const rooms = picked.slice(0, limit);
  const inArea = (r: PublicListing) => !!listing.area && r.area?.trim().toLowerCase() === listing.area.trim().toLowerCase();
  const label = !rooms.some(inArea)
    ? `More rooms near ${CAMPUSES[listing.campus]}`
    : rooms.every(inArea)
      ? `More rooms in ${listing.area}`
      : `More rooms in and around ${listing.area}`;
  return { label, area: listing.area, rooms };
}

export type AreaSummary = { area: string; campus: Campus; location: string | null; count: number; cover: string | null; minPrice: number };

// Areas that currently have rooms students can see, busiest first, each
// with a cover photo. Powers the "Where?" dropdown and the Browse row.
export async function listAreas(): Promise<AreaSummary[]> {
  const rooms = await searchListings({ campus: null, area: null, type: null, max: null, sort: "new" }, 200);
  const byArea = new Map<string, AreaSummary>();
  for (const r of rooms) {
    if (r.status !== "available" || !r.area) continue;
    const key = r.area.trim().toLowerCase();
    const found = byArea.get(key);
    if (found) {
      found.count += 1;
      found.minPrice = Math.min(found.minPrice, r.price);
    } else byArea.set(key, { area: r.area.trim(), campus: r.campus, location: r.location, count: 1, cover: r.photos[0] ?? null, minPrice: r.price });
  }
  return [...byArea.values()].sort((a, b) => b.count - a.count || a.area.localeCompare(b.area));
  }

    
