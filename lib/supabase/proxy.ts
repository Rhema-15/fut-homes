import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every /admin request: refreshes the login session
// and sends people to the right page.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Don't put code between createServerClient and getClaims.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  const onLoginPage = path === "/admin/login";

  if (!loggedIn && !onLoginPage) {
    return redirectKeepingCookies(request, response, "/admin/login");
  }
  if (loggedIn && onLoginPage) {
    return redirectKeepingCookies(request, response, "/admin");
  }

  return response;
}

function redirectKeepingCookies(
  request: NextRequest,
  from: NextResponse,
  to: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
