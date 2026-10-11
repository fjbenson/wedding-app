import type { Metadata } from "next";
import Link from "next/link";
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

        {why === "lost" && (
          <div role="alert" className="mt-8 rounded-xl border border-champagne-400 bg-cream px-4 py-4 text-sm text-ink">
            <p>
              This phone couldn&apos;t reach your wedding just now. It&apos;s still safe — nothing has been deleted.
            </p>
            <Link href="/" className="mt-3 flex h-11 items-center justify-center rounded-xl bg-ink text-ivory">
              Try again
            </Link>
            <Link href="/sign-in?fresh=1" className="mt-2 block text-center text-xs text-stone underline">
              Start a new wedding instead
            </Link>
          </div>
        )}

        {why && why !== "lost" && (
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
