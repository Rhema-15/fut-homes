import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../actions";

// Admin pages read the login cookie, so they render per request.
export const instant = false;

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  // Second lock, in case the proxy is ever skipped.
  if (!data.user) redirect("/admin/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            FUT Homes admin
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/agents" className="hover:underline">
              Agents
            </Link>
            <Link href="/admin/listings" className="hover:underline">
              Listings
            </Link>
            <Link href="/admin/import" className="hover:underline">
              Import
            </Link>
          </nav>
          <form action={logout} className="ml-auto">
            <button type="submit" className="text-sm text-neutral-600 hover:underline">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
