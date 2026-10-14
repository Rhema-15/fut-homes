import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Short links on share images: /r/9F1C2A → /rooms/<full id>.
// The code is the first 6 hex characters of the listing's id.
export async function GET(request: NextRequest, { params }: RouteContext<"/r/[code]">) {
  const code = (await params).code.toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(code)) return NextResponse.redirect(new URL("/rooms", request.url));

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase
    .from("listings")
    .select("id")
    .gte("id", `${code}00-0000-0000-0000-000000000000`)
    .lte("id", `${code}ff-ffff-ffff-ffff-ffffffffffff`)
    .order("created_at", { ascending: false })
    .limit(1);

  const match = data?.[0];
  return NextResponse.redirect(new URL(match ? `/rooms/${match.id}` : "/rooms", request.url));
}
