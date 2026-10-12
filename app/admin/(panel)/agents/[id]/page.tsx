import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/confirm-button";
import { createClient } from "@/lib/supabase/server";
import { formatWhatsapp } from "@/lib/options";
import { deleteAgent, setAgentActive, updateAgent } from "../actions";
import AgentForm from "../agent-form";

export const instant = false;
export const metadata: Metadata = { title: "Edit agent · FUT Homes admin", robots: { index: false } };

export default async function EditAgentPage({ params }: PageProps<"/admin/agents/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, whatsapp, photo_path, is_trusted, is_active, listings(count)")
    .eq("id", id)
    .maybeSingle();
  if (!agent) notFound();
  const listingCount = (agent.listings as unknown as { count: number }[])[0]?.count ?? 0;

  return (
    <div className="max-w-md">
      <Link href="/admin/agents" className="text-sm text-neutral-500 hover:underline">
        ← Agents
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Edit agent</h1>

      <form action={setAgentActive.bind(null, agent.id, !agent.is_active)} className="mt-6">
        <button type="submit" className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium">
          {agent.is_active ? "Hide agent and all their listings" : "Show agent again"}
        </button>
      </form>
      {!agent.is_active && (
        <p className="mt-2 text-sm text-red-600">Hidden: students can&apos;t see this agent or their listings.</p>
      )}

      <AgentForm
        action={updateAgent.bind(null, agent.id)}
        submitLabel="Save changes"
        agent={{
          name: agent.name,
          whatsapp: formatWhatsapp(agent.whatsapp),
          is_trusted: agent.is_trusted,
          photo_path: agent.photo_path,
        }}
      />

      <div className="mt-10 border-t border-neutral-200 pt-6">
        {listingCount === 0 ? (
          <form action={deleteAgent.bind(null, agent.id)}>
            <ConfirmButton
              message="Delete this agent for good? This can't be undone."
              className="text-sm font-medium text-red-700 hover:underline"
            >
              Delete agent
            </ConfirmButton>
          </form>
        ) : (
          <p className="text-sm text-neutral-500">
            To delete this agent, delete or move their {listingCount} listing{listingCount === 1 ? "" : "s"} first. Or
            just hide them above.
          </p>
        )}
      </div>
    </div>
  );
}
