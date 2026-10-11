import type { Metadata } from "next";
import EmailCodeForm from "@/components/email-code-form";

export const metadata: Metadata = {
  title: "Welcome — Wedding App",
};

/**
 * The front door (email first, 11 Oct 2026): one box for the email, then the
 * code. New couples go on to setup; anyone known opens their wedding.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="label">Wedding App</p>
          <h1 className="type-display mt-3 text-[44px] leading-[1.05] text-ink">Welcome</h1>
          <p className="mt-3 text-sm text-stone">Your email, to start planning or to open your wedding.</p>
        </div>

        <div className="glass-card mt-10 rounded-[22px] p-6">
          <EmailCodeForm />
        </div>

        <p className="mt-6 text-center text-xs text-stone">No password to remember — we email you a code.</p>
      </div>
    </main>
  );
}
