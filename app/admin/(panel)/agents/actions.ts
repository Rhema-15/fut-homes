"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState, pathList, text } from "@/lib/form-utils";
import { VERIFICATION_LEVELS, isOneOf, normalizeWhatsapp } from "@/lib/options";

export async function createAgent(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const whatsapp = normalizeWhatsapp(text(formData, "whatsapp"));
  const level = text(formData, "verification_level");
  const [photoPath] = pathList(formData, "photo");

  if (!name) return { error: "Enter the agent's name." };
  if (!whatsapp) return { error: "Enter a valid Nigerian WhatsApp number, like 0803 123 4567." };
  if (!isOneOf(VERIFICATION_LEVELS, level)) return { error: "Pick a verification level." };

  const supabase = await createClient();
  const { error } = await supabase.from("agents").insert({
    name,
    whatsapp,
    verification_level: level,
    photo_path: photoPath ?? null,
  });

  if (error) return { error: `Couldn't save the agent: ${error.message}` };
  redirect("/admin/agents");
}
