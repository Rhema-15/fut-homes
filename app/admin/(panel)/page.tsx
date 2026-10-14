import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin · FUT Homes",
  robots: { index: false },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ data: userData }, agents, listings, available] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("agents").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "available"),
  ]);

  const stats = [
    { label: "Agents", value: agents.count ?? 0 },
    { label: "Listings", value: listings.count ?? 0 },
    { label: "Available rooms", value: available.count ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Logged in as {userData.user?.email}</p>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 p-3">
            <dt className="text-xs text-neutral-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/agents/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Add agent
        </Link>
        <Link href="/admin/listings/new" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium">
          Add listing
        </Link>
        <Link href="/admin/import" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium">
          Import from chat
        </Link>
      </div>

      {(agents.error || listings.error) && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load data. Has the Day 2 database setup been run in Supabase?
        </p>
      )}
    </div>
  );
}
