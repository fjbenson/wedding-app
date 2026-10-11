import { createClient } from "@/lib/supabase/server";

/**
 * Logging in with an emailed code (11 Oct 2026). Everyone starts with an
 * anonymous login (see src/lib/supabase/middleware.ts); "Save your wedding"
 * adds an email to that same login, so the wedding carries over, and from
 * then on a code sent to that email signs in on any phone. Codes rather than
 * links, because a link opens in Safari, not the home-screen app.
 *
 * Supabase sends the emails through Resend (Authentication › Emails › SMTP),
 * and its "Magic Link" and "Change Email Address" templates show the code.
 */

export interface Login {
  id: string;
  email: string | null;
  anonymous: boolean;
}

export async function getLogin(): Promise<Login | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: String(claims.sub),
    email: typeof claims.email === "string" && claims.email ? claims.email : null,
    anonymous: claims.is_anonymous === true,
  };
}

/** Supabase's messages are written for developers; say it plainly. */
function plain(message: string): string {
  if (/rate limit|too many/i.test(message)) return "Too many codes asked for just now. Wait a few minutes and try again.";
  if (/already (been )?registered|already exists/i.test(message)) {
    return "That email already has a login. Sign in with it instead.";
  }
  if (/expired|invalid|otp/i.test(message)) return "That code didn't work. Check it, or ask for a new one.";
  if (/signups? not allowed|user not found/i.test(message)) return "There's no wedding saved to that email yet.";
  return message;
}

type Result = { error?: string };

/** Save your wedding, step 1: email a code to the address being added. */
export async function sendSaveCode(email: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  return error ? { error: plain(error.message) } : {};
}

/** Save your wedding, step 2: the code proves the email is theirs. */
export async function confirmSaveCode(email: string, token: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email_change" });
  return error ? { error: plain(error.message) } : {};
}

/** Signing in on another phone, step 1. Never makes a new login. */
export async function sendSignInCode(email: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  return error ? { error: plain(error.message) } : {};
}

/** Signing in on another phone, step 2. */
export async function confirmSignInCode(email: string, token: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  return error ? { error: plain(error.message) } : {};
}
