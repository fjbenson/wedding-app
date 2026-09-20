/**
 * Placeholder home page.
 *
 * Real screens come from the Claude Design handoff — this exists so the
 * scaffold runs and the Supabase wiring can be verified end to end.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Wedding App</h1>
      <p className="mt-4 text-neutral-600">
        Scaffold is running. Next: connect a Supabase project, run the migration
        in <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">supabase/migrations</code>,
        then build screens from the design handoff.
      </p>
    </main>
  );
}
