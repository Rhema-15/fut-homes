import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Agents log in with their WhatsApp number + a password Rhema sets.
// Everything runs through database functions (supabase/migrations/012 and 013);
// the browser only ever holds a random session token in a private cookie.

export const AGENT_COOKIE = "fh_agent";
export const AGENT_SESSION_SECONDS = 60 * 60 * 24 * 90;

export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type PortalRoom = {
  id: string;
  title: string | null;
  description: string | null;
  room_type: string | null;
  campus: string | null;
  area: string | null;
  price: number;
  rent_months: number | null;
  roommate_gender: string | null;
  amenities: string[] | null;
  agent_fee: number | null;
  caution_fee: number | null;
  fees_note: string | null;
  photos: string[];
  video_path: string | null;
  video_seconds: number | null;
  confirmed_at: string | null;
  answer: "available" | "taken" | null;
  answered_at: string | null;
  reviewed_at: string | null;
};

export type Portal = { name: string; must_change: boolean; rooms: PortalRoom[] };

export async function agentToken(): Promise<string | null> {
  return (await cookies()).get(AGENT_COOKIE)?.value ?? null;
}

export async function getPortal(): Promise<Portal | null> {
  const token = await agentToken();
  if (!token) return null;
  const { data } = await anonClient().rpc("agent_portal", { p_token: token });
  return (data as Portal | null) ?? null;
}

// "08031234567", "+234 803 123 4567" -> "2348031234567" for wa.me links.
export function waNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  return `234${digits.replace(/^0+/, "")}`;
}
