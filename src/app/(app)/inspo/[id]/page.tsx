import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { InlineSubmit, RemoveButton } from "@/components/form-bits";
import { INPUT } from "@/components/form-styles";
import { areaOptions } from "@/lib/areas";
import { listAreas } from "@/lib/db/areas";
import { getInspo } from "@/lib/db/inspo";
import { formatDayMonth } from "@/lib/dates";
import { deleteInspoAction, updateInspoAction } from "../actions";

export const metadata = { title: "Inspo — Wedding App" };

/** One saved idea, opened large (screen 32): its note, its folder, back to the source. */
export default async function InspoItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; detail?: string }>;
}) {
  const { id } = await params;
  const { saved, error, detail } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // Row-level security returns nothing for another wedding's idea.
  const item = await getInspo(id);
  if (!item) notFound();
  const areas = areaOptions(await listAreas(item.wedding_id));

  return (
    <main className="page pb-28 lg:max-w-3xl lg:pb-16">
      <Link
        href={item.area_key ? `/inspo?folder=${encodeURIComponent(item.area_key)}` : "/inspo"}
        className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        Inspo
      </Link>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}

      {item.picture && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.picture}
          alt={item.title ?? item.note ?? "A saved idea"}
          className="mt-4 max-h-[70dvh] w-full rounded-2xl bg-cream object-contain"
        />
      )}
      <div className="glass-card mt-6 rounded-[22px] p-5">
        {item.title && <h1 className="mb-2 text-2xl leading-snug text-ink">{item.title}</h1>}
        <p className="text-xs text-stone">Saved {formatDayMonth(item.created_at.slice(0, 10))}</p>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-champagne-600 underline underline-offset-4 hover:text-ink"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Open where it came from
          </a>
        )}

        <form action={updateInspoAction.bind(null, item.id)} className="mt-8 space-y-4">
          <label className="block text-sm text-ink">
            Folder
            <select name="folder" defaultValue={item.area_key ?? ""} className={INPUT}>
              <option value="">Unsorted</option>
              {areas.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-ink">
            Note
            <textarea name="note" rows={3} defaultValue={item.note ?? ""} className={INPUT} />
          </label>
          <div className="flex items-center gap-3">
            <InlineSubmit label="Save" pendingLabel="Saving…" />
            {saved && <span className="text-sm text-stone">Saved.</span>}
          </div>
        </form>

        <div className="mt-8 border-t border-linen pt-4">
          <RemoveButton action={deleteInspoAction.bind(null, item.id)} label="Remove this idea" question="Remove this from Inspo?" />
        </div>
      </div>
    </main>
  );
}
