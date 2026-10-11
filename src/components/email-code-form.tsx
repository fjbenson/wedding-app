"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { confirmCodeAction, sendCodeAction } from "@/app/sign-in/actions";
import { INPUT } from "@/components/form-styles";

/**
 * Email, then the code from the email (the sign-in page). New emails go on
 * to setup from the home page; known ones open their wedding.
 */
export default function EmailCodeForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(task: () => Promise<{ error?: string }>, next: () => void) {
    setBusy(true);
    setError("");
    try {
      const { error } = await task();
      if (error) setError(error);
      else next();
    } catch {
      // A page left open across a deploy calls an action that's gone.
      setError("The app has just been updated. Refresh the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  const button =
    "flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-sm text-ivory transition hover:bg-ink/90 disabled:opacity-60";

  if (step === "email") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => sendCodeAction(email), () => setStep("code"));
        }}
        className="space-y-3"
      >
        <label className="block">
          <span className="text-sm text-ink">Your email</span>
          {/* A plain text box with the email keyboard, not type="email": iPhones
              switch off text replacement (the owner's "le" shortcut) in email boxes. */}
          <input
            type="text"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="on"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={INPUT}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-ink">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={button}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? "Sending…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => confirmCodeAction(email, token),
          () => {
            router.push("/");
            router.refresh();
          },
        );
      }}
      className="space-y-3"
    >
      <p className="text-sm text-stone">
        We&apos;ve emailed a code to <span className="text-ink">{email}</span>. It can take a minute — check spam too.
      </p>
      <label className="block">
        <span className="text-sm text-ink">The code</span>
        <input
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="123456"
          className={`${INPUT} text-center font-display text-2xl tracking-[0.3em]`}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-ink">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={button}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? "Checking…" : "Continue"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setToken("");
          setError("");
        }}
        className="block w-full py-2 text-center text-sm text-champagne-600 underline underline-offset-4"
      >
        Use a different email, or send a new code
      </button>
    </form>
  );
}
