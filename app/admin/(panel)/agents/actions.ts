"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type FormState, pathList, saveError, text } from "@/lib/form-utils";
import { normalizeWhatsapp } from "@/lib/options";

export async function createAgent(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name");
  const whatsapp = normalizeWhatsapp(text(formData, "whatsapp"));
  const isTrusted = formData.get("is_trusted") === "on";
  const [photoPath] = pathList(formData, "photo");

  if (!name) return { error: "Enter the agent's name." };
  if (!whatsapp) return { error: "Enter a valid Nigerian WhatsApp number, like 0803 123 4567." };

  const supabase = await createClient();
  const { error } = await supabase.from("agents").insert({
    name,
    whatsapp,
    is_trusted: isTrusted,
    verification_level: isTrusted ? "trusted" : "id_verified",
    photo_path: photoPath ?? null,
  });

  if (error) return { error: saveError("agent", error.message) };
  redirect("/admin/agents");
}
