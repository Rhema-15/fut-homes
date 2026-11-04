"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AGENT_COOKIE, AGENT_SESSION_SECONDS, agentToken, anonClient } from "@/lib/agent-portal";

export type FormState = { error: string | null; ok?: string | null };

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export async function loginAgent(_prev: FormState, formData: FormData): Promise<FormState> {
  const phone = field(formData, "phone");
  const password = String(formData.get("password") ?? "");
  if (!phone || !password) return { error: "Enter your WhatsApp number and password." };

  const { data, error } = await anonClient().rpc("agent_login", { p_phone: phone, p_password: password });
  if (error) return { error: "Couldn't log in right now. Try again in a moment." };
  const result = data as { token?: string; error?: string } | null;
  if (result?.error === "locked") return { error: "Too many wrong tries. Wait 15 minutes, then try again." };
  if (!result?.token) return { error: "Wrong number or password." };

  (await cookies()).set(AGENT_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AGENT_SESSION_SECONDS,
    path: "/",
  });
  redirect("/agent");
}

export async function logoutAgent() {
  const token = await agentToken();
  if (token) await anonClient().rpc("agent_logout", { p_token: token });
  (await cookies()).delete(AGENT_COOKIE);
  redirect("/agent/login");
}

export async function answerRoom(listingId: string, answer: "available" | "taken") {
  const token = await agentToken();
  if (!token) redirect("/agent/login");
  await anonClient().rpc("agent_answer", { p_token: token, p_listing: listingId, p_answer: answer });
  redirect("/agent");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = await agentToken();
  if (!token) redirect("/agent/login");
  const oldPassword = String(formData.get("old") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 6) return { error: "The new password needs at least 6 characters." };
  if (next !== String(formData.get("again") ?? "")) return { error: "The two new passwords don't match." };
  const { data } = await anonClient().rpc("agent_change_password", { p_token: token, p_old: oldPassword, p_new: next });
  if (data !== true) return { error: "Your current password isn't right." };
  return { error: null, ok: "Password changed." };
}

export async function requestReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const phone = field(formData, "phone");
  if (!phone) return { error: "Enter your WhatsApp number." };
  await anonClient().rpc("agent_reset_request", { p_phone: phone });
  return { error: null, ok: "Done. FUT Homes will send you a code on WhatsApp. Then fill in step 2." };
}

export async function finishReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const phone = field(formData, "phone");
  const code = field(formData, "code");
  const next = String(formData.get("next") ?? "");
  if (!phone || !code) return { error: "Enter your number and the code." };
  const { data } = await anonClient().rpc("agent_reset_finish", { p_phone: phone, p_code: code, p_new: next });
  if (data === "short") return { error: "The new password needs at least 6 characters." };
  if (data === "locked") return { error: "Too many wrong tries. Wait 15 minutes, then try again." };
  if (data !== "ok") return { error: "That code didn't work or it expired. Ask for a new one." };
  redirect("/agent/login?reset=1");
                                          }
