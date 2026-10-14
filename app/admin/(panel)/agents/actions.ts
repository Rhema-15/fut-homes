"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState, pathList, saveError, text } from "@/lib/form-utils";
import { normalizeWhatsapp } from "@/lib/options";
import { badgeLevel, readChecks } from "@/lib/agent-checks";

type Parsed = { error: string } | { fields: Record<string, string | boolean | null> };

function parse(formData: FormData): Parsed {
  const name = text(formData, "name");
  const whatsapp = normalizeWhatsapp(text(formData, "whatsapp"));
  const checks = readChecks(formData);
  const level = badgeLevel(checks);
  const [photoPath] = pathList(formData, "photo");

  if (!name) return { error: "Enter the agent's name." };
  if (!whatsapp) return { error: "Enter a valid Nigerian WhatsApp number, like 0803 123 4567." };

  return {
    fields: {
      name,
      whatsapp,
      ...checks,
      // Older columns, kept in step with the checks.
      is_trusted: level === "trusted",
      verification_level: level === "trusted" ? "trusted" : "id_verified",
      photo_path: photoPath ?? null,
    },
  };
}

export async function createAgent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;
  const supabase = await createClient();
  const { error } = await supabase.from("agents").insert(parsed.fields);
  if (error) return { error: saveError("agent", error.message) };
  redirect("/admin/agents");
}

export async function updateAgent(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;
  const supabase = await createClient();
  const { data: before } = await supabase.from("agents").select("photo_path").eq("id", id).single();
  const { error } = await supabase.from("agents").update(parsed.fields).eq("id", id);
  if (error) return { error: saveError("agent", error.message) };
  if (before?.photo_path && before.photo_path !== parsed.fields.photo_path) {
    await supabase.storage.from("photos").remove([before.photo_path]);
  }
  redirect("/admin/agents");
}

// Hiding an agent hides all their listings from students too.
export async function setAgentActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("agents").update({ is_active: isActive }).eq("id", id);
  redirect(`/admin/agents/${id}`);
}

// Only possible once the agent has no listings left.
export async function deleteAgent(id: string) {
  const supabase = await createClient();
  const { data: agent } = await supabase.from("agents").select("photo_path").eq("id", id).single();
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (!error && agent?.photo_path) await supabase.storage.from("photos").remove([agent.photo_path]);
  redirect("/admin/agents");
}
