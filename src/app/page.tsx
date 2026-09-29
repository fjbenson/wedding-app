import { createClient } from "@/lib/supabase/server";
import { getCurrentWedding } from "@/lib/db/weddings";
import { listMilestones } from "@/lib/db/milestones";
import Cover from "@/components/cover";
import ThisMonth from "@/components/this-month";
import MenuBar from "@/components/menu-bar";
import { createWeddingAction } from "./actions";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wedding = await getCurrentWedding();

  if (wedding) {
    const milestones = await listMilestones(wedding.id);

    return (
      <main className="min-h-screen pb-28">
        {/* The cover runs edge to edge; everything under it sits in a column. */}
        <Cover name={wedding.name} weddingDate={wedding.wedding_date} />
        <div className="mx-auto max-w-md md:max-w-xl">
          <ThisMonth milestones={milestones} hasDate={wedding.wedding_date !== null} />
          {/* No sign out while visitors are anonymous — signing out would lose the wedding. */}
          {user?.email && <SignedIn email={user.email} />}
        </div>
        <MenuBar current="/" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8">
      {user?.email && (
        <header className="flex items-center justify-between">
          <p className="text-sm text-stone">{user.email}</p>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="text-sm text-stone underline underline-offset-4 hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </header>
      )}

      <div className="flex flex-1 flex-col justify-center py-10">
        <NewWedding error={error} detail={detail} />
      </div>
    </main>
  );
}

/** Who's signed in, and the way out — quietly, at the foot of the page. */
function SignedIn({ email }: { email?: string }) {
  return (
    <form
      action="/auth/sign-out"
      method="post"
      className="mt-10 px-6 text-center text-xs text-stone"
    >
      {email} ·{" "}
      <button type="submit" className="underline underline-offset-4 hover:text-ink">
        Sign out
      </button>
    </form>
  );
}

/** Shown once, before there's a wedding for the hub to be about. */
function NewWedding({ error, detail }: { error?: string; detail?: string }) {
  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <h1 className="text-3xl text-ink">Let&apos;s start with the day itself</h1>
      <p className="mt-3 text-sm text-stone">
        Name it however you like — it&apos;s what you&apos;ll see when you sign in.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-linen bg-cream px-4 py-3 text-sm text-ink"
        >
          {error}
          {detail && (
            <span className="mt-2 block break-words font-mono text-xs text-stone">
              {detail}
            </span>
          )}
        </p>
      )}

      <form action={createWeddingAction} className="mt-8 space-y-4 text-left">
        <div>
          <label htmlFor="name" className="block text-sm text-ink">
            Whose wedding?
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Frankie &amp; Sam"
            className="mt-2 w-full rounded-xl border border-linen bg-white px-4 py-3 text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
          />
        </div>

        <div>
          <label htmlFor="wedding_date" className="block text-sm text-ink">
            The date <span className="text-stone">(if you have one)</span>
          </label>
          <input
            id="wedding_date"
            name="wedding_date"
            type="date"
            className="mt-2 w-full rounded-xl border border-linen bg-white px-4 py-3 text-ink focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90"
        >
          Create it
        </button>
      </form>
    </div>
  );
}
