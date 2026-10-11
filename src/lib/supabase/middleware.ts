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
  let user: { id: string; anonymous?: boolean } | null = auth?.claims
    ? { id: auth.claims.sub, anonymous: auth.claims.is_anonymous === true }
    : null;

  // A browser that already has a login must never be quietly handed a new
  // one (11 Oct 2026: a refresh that failed did exactly that, and the
  // owner's wedding vanished from their phone — still in the database, but
  // out of reach). Try once more; if it still can't be read, say so rather
  // than start a new wedding. "?fresh" on the sign-in page is the way out.
  const { pathname, searchParams } = request.nextUrl;
  const hadLogin = request.cookies.getAll().some((c) => /^sb-.+-auth-token/.test(c.name));
  const startFresh = pathname === "/sign-in" && searchParams.has("fresh");
  if (!user && hadLogin && !startFresh) {
    const { data: again } = await supabase.auth.getClaims();
    user = again?.claims ? { id: again.claims.sub, anonymous: again.claims.is_anonymous === true } : null;
    if (!user && !isPublic(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = "?why=lost";
      return NextResponse.redirect(url);
    }
  }

  // No sign-in step to start: a visitor without a session is quietly given
  // an anonymous one, which is still a real user as far as row-level
  // security is concerned, so every wedding stays private to its creator.
  // It lives in this browser only until Settings › Save your wedding adds an
  // email (src/lib/db/auth.ts). Needs "Allow anonymous
  // sign-ins" switched on in Supabase; if it's off, this fails and the
  // visitor falls through to the email sign-in page as before.
  // Runs on the sign-in page too, so an old bookmark to it still gets you in.
  // Skipped on /auth routes and when an emailed link has landed with its code.
  let anonymousError = "";
  if (!user && (!hadLogin || startFresh) && !pathname.startsWith("/auth") && !searchParams.has("code")) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("anonymous sign-in failed", error.message);
      anonymousError = error.message;
    } else {
      user = data.user ? { id: data.user.id, anonymous: true } : null;
    }
  }

  // If that failed, say why on the sign-in page instead of failing silently.
  if (anonymousError && pathname === "/sign-in" && !searchParams.has("why") && !startFresh) {
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

  // Anonymous visitors may use the sign-in page: it's how a phone opens a
  // wedding already saved to an email. Only a saved login is sent home.
  if (user && ((!user.anonymous && pathname === "/sign-in") || startFresh)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    // Carry over any login cookies just set, or the new login is lost.
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
