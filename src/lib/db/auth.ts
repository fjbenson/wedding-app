import { createClient } from "@/lib/supabase/server";

/**
 * Logging in with an emailed code, email first (11 Oct 2026). One box: the
 * email. A new email gets an account and goes on to setup; a known one opens
 * its wedding — nobody chooses between "log in" and "sign up". Codes rather
 * than links, because a link opens in Safari, not the home-screen app. You
 * stay signed in on that device until you sign out (Settings).
 *
 * Supabase sends the emails through Resend (Authentication › Emails › SMTP);
 * its "Confirm signup" (new emails) and "Magic Link" (known ones) templates
 * show the code.
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
  if (/expired|invalid|otp/i.test(message)) return "That code didn't work. Check it, or ask for a new one.";
  return message;
}

type Result = { error?: string };

/** Step 1: email a code — making the account if the email is new. */
export async function sendSignInCode(email: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return error ? { error: plain(error.message) } : {};
}

/** Step 2: the code from the email signs them in. */
export async function confirmSignInCode(email: string, token: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  return error ? { error: plain(error.message) } : {};
}
