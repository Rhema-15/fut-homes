"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Apply what an agent said. "available": the room was just confirmed, so
// the 7/14-day clocks restart. "taken": greyed out for 7 days, then hidden.
async function apply(supabase: Awaited<ReturnType<typeof createClient>>, listingId: string) {
  const { data: check } = await supabase.from("agent_checks").select("answer").eq("listing_id", listingId).maybeSingle();
  if (!check) return;
  const now = new Date().toISOString();
  if (check.answer === "taken") {
    await supabase.from("listings").update({ status: "taken", taken_at: now }).eq("id", listingId);
  } else {
    await supabase.from("listings").update({ confirmed_at: now }).eq("id", listingId);
  }
  await supabase.from("agent_checks").update({ reviewed_at: now }).eq("listing_id", listingId);
}

export async function applyCheck(listingId: string) {
  const supabase = await createClient();
  await apply(supabase, listingId);
  redirect("/admin/availability");
}

export async function applyAllChecks() {
  const supabase = await createClient();
  const { data } = await supabase.from("agent_checks").select("listing_id").is("reviewed_at", null);
  for (const row of data ?? []) await apply(supabase, row.listing_id);
  redirect("/admin/availability");
}

export async function ignoreCheck(listingId: string) {
  const supabase = await createClient();
  await supabase.from("agent_checks").update({ reviewed_at: new Date().toISOString() }).eq("listing_id", listingId);
  redirect("/admin/availability");
}
