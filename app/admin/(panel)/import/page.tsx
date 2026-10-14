import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ImportClient from "./import-client";

export const instant = false;
export const metadata: Metadata = { title: "Import · FUT Homes admin", robots: { index: false } };

// Listings prepared in the chat arrive as files in /public/_import with a
// batch.json. This page uploads them with one tap, from any device.
export default async function ImportPage() {
  const supabase = await createClient();
  const [{ data: agents }, { data: existing }] = await Promise.all([
    supabase.from("agents").select("id, name").order("name"),
    supabase.from("listings").select("agent_id, title, price"),
  ]);

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Import listings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Rooms prepared in the chat. Check the agent for each, then tap Import. Keep this page open until it says done.
      </p>
      <ImportClient agents={agents ?? []} existing={existing ?? []} />
    </div>
  );
}
