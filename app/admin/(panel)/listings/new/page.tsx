import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "./listing-form";

export const instant = false;
export const metadata: Metadata = { title: "Add listing · FUT Homes admin", robots: { index: false } };

export default async function NewListingPage() {
  const supabase = await createClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Add listing</h1>
      {agents && agents.length > 0 ? (
        <ListingForm agents={agents} />
      ) : (
        <p className="mt-4 text-neutral-600">
          Add an agent first, then come back.{" "}
          <Link href="/admin/agents/new" className="underline">
            Add agent
          </Link>
        </p>
      )}
    </div>
  );
}
