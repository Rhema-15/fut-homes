import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { waNumber } from "@/lib/agent-portal";
import { ROOM_TYPES, type RoomType, formatNaira, listingCode } from "@/lib/options";
import { SITE_HOST } from "@/lib/share";
import { applyAllChecks, applyCheck, ignoreCheck } from "./actions";

export const instant = false;

export const metadata: Metadata = {
  title: "Availability · FUT Homes admin",
  robots: { index: false },
};

type CheckRow = {
  listing_id: string;
  answer: "available" | "taken";
  answered_at: string;
  listings: {
    room_type: string | null;
    area: string | null;
    price: number | null;
    status: string;
    agents: { name: string; whatsapp: string } | null;
  } | null;
};

type Found = { id: string; room_type: string | null; area: string | null; price: number | null; status: string; agent_name: string; agent_whatsapp: string };

// Accepts a pasted link (/r/9F1C2A or /rooms/<id>) or the bare 6-character code.
function codeFrom(q: string): string | null {
  const text = q.trim();
  const uuid = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return uuid[0].replace(/-/g, "").slice(0, 6).toUpperCase();
  const short = text.match(/\/r\/([0-9a-f]{6})\b/i) ?? text.match(/^#?([0-9a-f]{6})$/i);
  return short ? short[1].toUpperCase() : null;
}

function typeName(t: string | null) {
  return t && t in ROOM_TYPES ? ROOM_TYPES[t as RoomType] : "Room";
}

export default async function AvailabilityPage({ searchParams }: PageProps<"/admin/availability">) {
  const q = String((await searchParams).q ?? "");
  const supabase = await createClient();

  let found: Found | null = null;
  const code = q ? codeFrom(q) : null;
  if (code) {
    const { data } = await supabase.rpc("admin_find_listing", { p_code: code });
    found = (data as Found | null) ?? null;
  }

  const { data, error } = await supabase
    .from("agent_checks")
    .select("listing_id, answer, answered_at, listings(room_type, area, price, status, agents(name, whatsapp))")
    .is("reviewed_at", null)
    .order("answered_at", { ascending: true });
  const checks = (data ?? []) as unknown as CheckRow[];

  const byAgent = new Map<string, CheckRow[]>();
  for (const c of checks) {
    const name = c.listings?.agents?.name ?? "Unknown agent";
    byAgent.set(name, [...(byAgent.get(name) ?? []), c]);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Availability</h1>

      <form className="mt-4 flex gap-2" action="/admin/availability">
        <input
          name="q"
          defaultValue={q}
          placeholder="Paste a room link or code (like 9F1C2A)"
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Find agent
        </button>
      </form>
      {q && !found && (
        <p className="mt-3 text-sm text-red-600">{code ? `No room found for ${code}.` : "That doesn't look like a room link or code."}</p>
      )}
      {found && (
        <div className="mt-3 rounded-lg border border-neutral-300 p-3 text-sm">
          <p className="font-medium">
            {typeName(found.room_type)}
            {found.area ? ` · ${found.area}` : ""} · {found.price ? formatNaira(found.price) : "no price"} · {found.status}
          </p>
          <p className="mt-1">
            Agent: <b>{found.agent_name}</b> · {found.agent_whatsapp}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <a
              className="rounded-md bg-green-700 px-3 py-2 font-medium text-white"
              href={`https://wa.me/${waNumber(found.agent_whatsapp)}?text=${encodeURIComponent(
                `Hi ${found.agent_name.split(/\s+/)[0]}, is this room still available? https://${SITE_HOST}/r/${listingCode(found.id)}`,
              )}`}
            >
              Ask on WhatsApp
            </a>
            <Link className="rounded-md border border-neutral-300 px-3 py-2 font-medium" href={`/admin/listings/${found.id}`}>
              Open listing
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Answers waiting for you ({checks.length})</h2>
        {checks.length > 0 && (
          <form action={applyAllChecks}>
            <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
              Confirm all {checks.length}
            </button>
          </form>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Confirm applies the answer: &quot;still available&quot; restarts the room&apos;s clock, &quot;not available&quot; marks it Taken.
      </p>
      {error && <p className="mt-3 text-sm text-red-600">Couldn&apos;t load answers: {error.message}. Has SQL 012 been run?</p>}
      {!error && checks.length === 0 && <p className="mt-4 text-sm text-neutral-500">No new answers.</p>}

      {[...byAgent.entries()].map(([name, rows]) => (
        <section key={name} className="mt-6">
          <h3 className="font-semibold">{name}</h3>
          <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {rows.map((c) => (
              <li key={c.listing_id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/listings/${c.listing_id}`} className="font-medium hover:underline">
                    {typeName(c.listings?.room_type ?? null)}
                    {c.listings?.area ? ` · ${c.listings.area}` : ""} · {c.listings?.price ? formatNaira(c.listings.price) : ""}
                  </Link>
                  <p className={c.answer === "taken" ? "text-red-700" : "text-green-700"}>
                    {c.answer === "taken" ? "Says: not available anymore" : "Says: still available"}
                  </p>
                </div>
                <form action={applyCheck.bind(null, c.listing_id)}>
                  <button type="submit" className="rounded-md bg-neutral-900 px-3 py-2 font-medium text-white">
                    Confirm
                  </button>
                </form>
                <form action={ignoreCheck.bind(null, c.listing_id)}>
                  <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2">
                    Ignore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
