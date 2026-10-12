"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      return { error: "Wrong email or password." };
    }
    if (error.code === "email_not_confirmed") {
      return { error: "This email isn't confirmed yet in Supabase." };
    }
    // Temporary while setting up: show which Supabase URL the site uses.
    return {
      error: `Couldn't log in: ${error.message}. Site is using Supabase URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL}"`,
    };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
