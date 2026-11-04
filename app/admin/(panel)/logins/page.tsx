import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { waNumber } from "@/lib/agent-portal";
import { SITE_HOST } from "@/lib/share";
import { ResetCodeForm, SetPasswordForm } from "./login-forms";

export const instant = false;

export const metadata: Metadata = {
  title: "Agent logins · FUT Homes admin",
  robots: { index: false },
};

type AgentLogin = { id: string; name: string; whatsapp: string; has_login: boolean; reset_id: string | null };

export default async function LoginsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_agent_logins");
  const agents = (data ?? []) as AgentLogin[];
  const asking = agents.filter((a) => a.reset_id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Agent logins</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Agents log in at {SITE_HOST}/agent with their WhatsApp number and the password you set here.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">Couldn&apos;t load agents: {error.message}. Has SQL 012 been run?</p>}

      {asking.length > 0 && (
        <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <h2 className="font-semibold">Forgot-password requests ({asking.length})</h2>
          <ul className="mt-2 flex flex-col gap-3">
            {asking.map((a) => (
              <li key={a.id} className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  {a.name} · {a.whatsapp}
                </span>
                <ResetCodeForm requestId={a.reset_id!} name={a.name} phone={a.whatsapp} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {agents.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{a.name}</span>
              <span className="text-neutral-500">{a.whatsapp}</span>
              <span className={"rounded-full px-2 py-0.5 text-xs " + (a.has_login ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600")}>
                {a.has_login ? "Has login" : "No login yet"}
              </span>
              {a.has_login && (
                <a
                  className="text-xs underline"
                  href={`https://wa.me/${waNumber(a.whatsapp)}?text=${encodeURIComponent(
                    `Hi ${a.name.trim().split(/\s+/)[0]}, please open https://${SITE_HOST}/agent and tap "Still available" or "Not available anymore" on your rooms. Thank you.`,
                  )}`}
                >
                  Remind on WhatsApp
                </a>
              )}
            </div>
            <SetPasswordForm agentId={a.id} name={a.name} phone={a.whatsapp} hasLogin={a.has_login} />
          </li>
        ))}
      </ul>
    </div>
  );
}
