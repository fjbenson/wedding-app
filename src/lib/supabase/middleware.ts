import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Paths reachable without being signed in. */
const PUBLIC_PATHS = ["/sign-in", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Keeps the auth session fresh, and sends signed-out visitors to sign in. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
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

  // Do not remove: this refreshes the token and must run before any redirect
  // logic. getClaims checks the session's signature here on the server
  // instead of asking Supabase on every tap (it only asks when the session
  // needs refreshing, or if the project still uses the older shared-secret
  // keys), which is most of the wait when moving between screens.
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  // Email first (owner's call, 11 Oct 2026): every wedding belongs to an
  // email login from its first minute. The anonymous logins used until then
  // lost a wedding when one failed to refresh, so they no longer count.
  const signedIn = Boolean(claims?.sub) && claims?.is_anonymous !== true;
  const { pathname } = request.nextUrl;

  /** A redirect that keeps any login cookies just refreshed. */
  function go(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!signedIn && !isPublic(pathname)) return go("/sign-in");
  if (signedIn && pathname === "/sign-in") return go("/");

  return response;
}
