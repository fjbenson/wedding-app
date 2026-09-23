import type { Metadata } from "next";
import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Wedding App",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-4xl text-ink">Wedding App</h1>
          <p className="mt-3 text-sm text-muted">
            Everything for the day, in one place.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-rose-100 bg-card p-7 shadow-sm">
          <SignInForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          No password to remember — we email you a link that signs you straight in.
        </p>
      </div>
    </main>
  );
}
