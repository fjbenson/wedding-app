"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type State = "idle" | "sending" | "sent" | "error";

/**
 * Magic-link sign in. Supabase emails a one-tap link; tapping it lands on
 * /auth/callback, which turns the code in the URL into a session.
 */
export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto h-8 w-8 text-sage" aria-hidden />
        <h2 className="mt-4 text-2xl text-ink">Check your email</h2>
        <p className="mt-2 text-sm text-muted">
          We&apos;ve sent a link to <span className="text-ink">{email}</span>. Tap it
          and you&apos;re in.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-5 text-sm text-rose-500 underline underline-offset-4 hover:text-rose-700"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-ink">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-xl border border-rose-100 bg-canvas px-4 py-3 text-ink placeholder:text-muted/60 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>

      {state === "error" && (
        <p role="alert" className="text-sm text-rose-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-card transition hover:bg-rose-600 disabled:opacity-60"
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {state === "sending" ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}
