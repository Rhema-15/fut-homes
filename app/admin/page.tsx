import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

// Admin pages read the login cookie, so they render per request.
export const instant = false;

export const metadata: Metadata = {
  title: "Admin · FUT Homes",
  robots: { index: false },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Second lock, in case the proxy is ever skipped.
  if (!data.user) redirect("/admin/login");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        Logged in as {data.user.email}
      </p>
    </main>
  );
}
