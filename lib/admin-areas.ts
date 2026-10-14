import { createClient } from "@/lib/supabase/server";

// Areas already used on listings, so Rhema picks "Gidan Mangoro" from a
// list instead of typing it three different ways.
export async function knownAreas(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("area").not("area", "is", null);
  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const a = String(row.area ?? "").trim();
    if (a && !seen.has(a.toLowerCase())) seen.set(a.toLowerCase(), a);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
