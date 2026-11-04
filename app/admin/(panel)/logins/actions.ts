"use server";

import { createClient } from "@/lib/supabase/server";
import { waNumber } from "@/lib/agent-portal";
import { SITE_HOST } from "@/lib/share";

export type LoginState = { error: string | null; wa?: string | null; note?: string | null };

function waLink(phone: string, text: string) {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

export async function setAgentPassword(agentId: string, name: string, phone: string, _prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "").trim();
  if (password.length < 6) return { error: "Use at least 6 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_agent_password", { p_agent: agentId, p_password: password });
  if (error || data !== true) return { error: error?.message ?? "Couldn't save the password. Has SQL 012 been run?" };
  const first = name.trim().split(/\s+/)[0];
  const text = `Hi ${first}, here is your FUT Homes login.\nLink: https://${SITE_HOST}/agent\nNumber: ${phone}\nPassword: ${password}\nOpen it and tap "Still available" or "Not available anymore" on each of your rooms. Please change the password after you log in.`;
  return { error: null, note: "Saved. Send it to the agent now (the password is only shown here once).", wa: waLink(phone, text) };
}

export async function makeResetCode(requestId: string, name: string, phone: string, _prev: LoginState): Promise<LoginState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_reset_code", { p_request: requestId });
  if (error || !data) return { error: error?.message ?? "That request is no longer open." };
  const first = name.trim().split(/\s+/)[0];
  const text = `Hi ${first}, your FUT Homes code is ${data}. It works for 10 minutes. Open https://${SITE_HOST}/agent/reset, fill step 2, and choose a new password.`;
  return { error: null, note: "Code ready. Send it now.", wa: waLink(phone, text) };
}
