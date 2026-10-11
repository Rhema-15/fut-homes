import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the admin area is protected. Public pages never touch auth.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
