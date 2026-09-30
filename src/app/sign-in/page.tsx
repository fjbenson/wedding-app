import type { Metadata } from "next";
import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in — Wedding App",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ why?: string }>;
}) {
  const { why } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-4xl text-ink">Wedding App</h1>
          <p className="mt-3 text-sm text-stone">
            Everything for the day, in one place.
          </p>
        </div>

        {why && (
          <p
            role="alert"
            className="mt-8 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink"
          >
            The app tried to let you straight in, but Supabase said no:
            <span className="mt-2 block break-words font-mono text-xs text-stone">{why}</span>
          </p>
        )}

        <div className="mt-10 rounded-3xl border border-linen bg-white p-7 shadow-sm">
          <SignInForm />
        </div>

        <p className="mt-6 text-center text-xs text-stone">
          No password to remember — we email you a link that signs you straight in.
        </p>
      </div>
    </main>
  );
}
