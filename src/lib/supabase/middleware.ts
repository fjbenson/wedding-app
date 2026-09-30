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
  let user: { id: string } | null = auth?.claims ? { id: auth.claims.sub } : null;

  // For now there's no sign-in step: a visitor without a session is quietly
  // given an anonymous one, which is still a real user as far as row-level
  // security is concerned, so every wedding stays private to its creator.
  // The catch is that it lives in this browser only. Needs "Allow anonymous
  // sign-ins" switched on in Supabase; if it's off, this fails and the
  // visitor falls through to the email sign-in page as before.
  // Runs on the sign-in page too, so an old bookmark to it still gets you in.
  // Skipped on /auth routes and when an emailed link has landed with its code.
  const { pathname, searchParams } = request.nextUrl;
  let anonymousError = "";
  if (!user && !pathname.startsWith("/auth") && !searchParams.has("code")) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("anonymous sign-in failed", error.message);
      anonymousError = error.message;
    } else {
      user = data.user;
    }
  }

  // If that failed, say why on the sign-in page instead of failing silently.
  if (anonymousError && pathname === "/sign-in" && !searchParams.has("why")) {
    const url = request.nextUrl.clone();
    url.search = `?why=${encodeURIComponent(anonymousError)}`;
    return NextResponse.redirect(url);
  }

  // If Supabase doesn't recognise the address a sign-in link asked to return
  // to, it sends people to its "Site URL" instead — the home page, with the
  // code attached. Pass that code on to the callback rather than losing it.
  if (!user && pathname === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = anonymousError ? `?why=${encodeURIComponent(anonymousError)}` : "";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
