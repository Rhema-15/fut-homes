import { CHECK_AFTER_DAYS, HIDE_AFTER_DAYS } from "@/lib/public-data";
import { whatsappLink } from "@/lib/contact";
import { ROOM_TYPES, type RoomType, formatNaira } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import { confirmListing, setListingStatus } from "@/app/admin/(panel)/listings/actions";

type Row = {
  id: string;
  title: string;
  room_type: RoomType;
  area: string | null;
  price: number;
  confirmed_at: string;
  agents: { name: string; whatsapp: string } | null;
};

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// Rooms nobody has confirmed for a week. One tap asks the agent on
// WhatsApp; then Still available or Taken.
export default async function NeedsChecking() {
  const supabase = await createClient();
  const cutoff = isoDaysAgo(CHECK_AFTER_DAYS);
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, room_type, area, price, confirmed_at, agents(name, whatsapp)")
    .eq("status", "available")
    .eq("is_published", true)
    .lt("confirmed_at", cutoff)
    .order("confirmed_at", { ascending: true });

  if (error?.code === "42703") {
    return (
      <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        Run 006_confirmed_at.sql in Supabase to turn on room check reminders.
      </p>
    );
  }
  const rows = (data ?? []) as unknown as Row[];

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        Needs checking {rows.length > 0 && <span className="text-red-600">({rows.length})</span>}
      </h2>
      <p className="text-sm text-neutral-500">
        Rooms not confirmed for {CHECK_AFTER_DAYS}+ days. After {HIDE_AFTER_DAYS} days they hide from students until you
        confirm them.
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-green-700">All rooms are up to date.</p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {rows.map((r) => {
            const days = daysSince(r.confirmed_at);
            const hidden = days >= HIDE_AFTER_DAYS;
            const type = ROOM_TYPES[r.room_type];
            const message = `Hi${r.agents ? ` ${r.agents.name.split(" ")[0]}` : ""}, it's FUT Homes. Is your ${type.toLowerCase()}${
              r.area ? ` in ${r.area}` : ""
            } (${formatNaira(r.price)}/year) still available? Students are looking.`;
            return (
              <li key={r.id} className="p-3 text-sm">
                <p className="font-medium">{r.title}</p>
                <p className="text-neutral-500">
                  {r.agents?.name ?? "No agent"} · {formatNaira(r.price)} · checked {days} days ago
                  {hidden && <span className="ml-1 text-red-600">· hidden from students</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.agents && (
                    <a
                      href={whatsappLink(r.agents.whatsapp, message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-green-700 px-3 py-1.5 font-medium text-white"
                    >
                      Ask agent
                    </a>
                  )}
                  <form action={confirmListing.bind(null, r.id, "/admin")}>
                    <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium">
                      Still available
                    </button>
                  </form>
                  <form action={setListingStatus.bind(null, r.id, "taken", "/admin")}>
                    <button type="submit" className="rounded-md border border-red-300 px-3 py-1.5 font-medium text-red-700">
                      Taken
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
