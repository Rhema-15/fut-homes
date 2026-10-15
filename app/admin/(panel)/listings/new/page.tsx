import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "../listing-form";
import { createListing } from "../actions";
import { knownAreas } from "@/lib/admin-areas";

export const instant = false;
export const metadata: Metadata = { title: "Add listing · FUT Homes admin", robots: { index: false } };

export default async function NewListingPage({ searchParams }: PageProps<"/admin/listings/new">) {
  const { added } = await searchParams;
  const addedKey = typeof added === "string" ? added : "first";
  const supabase = await createClient();
  const areas = await knownAreas();
  const { data: agents } = await supabase
    .from("agents")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Add listing</h1>
      {addedKey !== "first" && (
        <p role="status" className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved ✓ Paste the next one.{" "}
          <Link href="/admin/listings" className="underline">
            See all listings
          </Link>
        </p>
      )}
      {agents && agents.length > 0 ? (
        <ListingForm key={addedKey} agents={agents} areas={areas} action={createListing} quickAdd />
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
