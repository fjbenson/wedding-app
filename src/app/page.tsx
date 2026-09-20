import Link from "next/link";
import { buttonStyles } from "@/components/ui";

/**
 * Placeholder home page.
 *
 * The real screens (sign in, dashboard, contacts, timeline, RSVP) come next.
 * Until then this points at the design system so there's something to look at.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-rose-500">
        Wedding App
      </p>
      <h1 className="mt-4 text-display-lg text-plum-800">
        Everything in one place.
      </h1>
      <p className="mt-5 max-w-prose text-lg text-ink-muted">
        Contacts, timeline and RSVPs. The screens aren&apos;t built yet — the
        design system they&apos;ll be made from is.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/design" className={buttonStyles("primary", "lg")}>
          See the design system
        </Link>
      </div>
    </main>
  );
}
