import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatWhatsapp, photoUrl } from "@/lib/options";
import { badgeLevel } from "@/lib/agent-checks";

export const instant = false;
export const metadata: Metadata = { title: "Agents · FUT Homes admin", robots: { index: false } };

export default async function AgentsPage() {
  const supabase = await createClient();
  // Falls back to the old columns until SQL 005 has been run.
  let { data: agents, error } = await supabase
    .from("agents")
    .select("id, name, whatsapp, photo_path, is_active, long_time_poster, still_posting, students_confirmed, listings(count)")
    .order("created_at", { ascending: false });
  if (error?.code === "42703") {
    const old = await supabase
      .from("agents")
      .select("id, name, whatsapp, photo_path, is_active, is_trusted, listings(count)")
      .order("created_at", { ascending: false });
    agents = (old.data ?? []).map((a) => ({
      ...a,
      long_time_poster: false,
      still_posting: false,
      students_confirmed: a.is_trusted,
    })) as typeof agents;
    error = old.error;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <Link href="/admin/agents/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Add agent
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">Couldn&apos;t load agents: {error.message}</p>}
      {agents?.length === 0 && <p className="mt-6 text-neutral-500">No agents yet. Add your first one.</p>}

      <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {agents?.map((agent) => {
          const count = (agent.listings as unknown as { count: number }[])[0]?.count ?? 0;
          return (
            <li key={agent.id} className="flex items-center gap-3 p-3">
              {agent.photo_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(agent.photo_path)} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  <Link href={`/admin/agents/${agent.id}`} className="hover:underline">
                    {agent.name}
                  </Link>
                  {!agent.is_active && <span className="ml-2 text-xs text-red-600">(hidden)</span>}
                </p>
                <p className="text-sm text-neutral-500">
                  {formatWhatsapp(agent.whatsapp)} ·{" "}
                  {{ trusted: "Trusted agent", verified: "Verified", none: "No badge" }[badgeLevel(agent) ?? "none"]} · {count} listing
                  {count === 1 ? "" : "s"}
                </p>
              </div>
              <Link href={`/admin/agents/${agent.id}`} className="shrink-0 text-sm underline">
                Edit
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
