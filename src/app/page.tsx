import { createClient } from "@/lib/supabase/server";
import { listWeddings } from "@/lib/db/weddings";
import Hub from "@/components/hub";
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

  const weddings = await listWeddings();
  const wedding = weddings[0] ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <p className="text-sm text-muted">{user?.email}</p>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">
        {wedding ? (
          <Hub name={wedding.name} weddingDate={wedding.wedding_date} />
        ) : (
          <NewWedding error={error} detail={detail} />
        )}
      </div>
    </main>
  );
}

/** Shown once, before there's a wedding for the hub to be about. */
function NewWedding({ error, detail }: { error?: string; detail?: string }) {
  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <h1 className="text-3xl text-ink">Let&apos;s start with the day itself</h1>
      <p className="mt-3 text-sm text-muted">
        Name it however you like — it&apos;s what you&apos;ll see when you sign in.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
          {detail && (
            <span className="mt-2 block break-words font-mono text-xs text-muted">
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
            className="mt-2 w-full rounded-xl border border-rose-100 bg-card px-4 py-3 text-ink placeholder:text-muted/60 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label htmlFor="wedding_date" className="block text-sm text-ink">
            The date <span className="text-muted">(if you have one)</span>
          </label>
          <input
            id="wedding_date"
            name="wedding_date"
            type="date"
            className="mt-2 w-full rounded-xl border border-rose-100 bg-card px-4 py-3 text-ink focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-rose-500 px-4 py-3 text-card transition hover:bg-rose-600"
        >
          Create it
        </button>
      </form>
    </div>
  );
}
