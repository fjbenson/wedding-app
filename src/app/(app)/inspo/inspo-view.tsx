import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import type { AreaOption } from "@/lib/areas";
import type { InspoWithPicture } from "@/lib/db/inspo";

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** One saved idea as a tile: its picture, or a card for a link with none. */
export function InspoTile({ item }: { item: InspoWithPicture }) {
  return (
    <Link href={`/inspo/${item.id}`} className="glass-card group mb-3 block break-inside-avoid overflow-hidden rounded-2xl">
      {item.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.picture}
          alt={item.title ?? item.note ?? "A saved idea"}
          loading="lazy"
          className="w-full transition group-hover:opacity-90"
        />
      ) : (
        <span className="flex aspect-[4/3] flex-col justify-end gap-1 p-4">
          <ExternalLink className="h-4 w-4 text-champagne-600" strokeWidth={1.8} aria-hidden />
          <span className="line-clamp-3 font-display text-lg leading-snug text-ink">{item.title ?? host(item.url ?? "")}</span>
          {item.url && <span className="text-xs text-stone">{host(item.url)}</span>}
        </span>
      )}
      {item.note && <span className="block px-3 py-2 text-xs leading-relaxed text-stone">{item.note}</span>}
    </Link>
  );
}

/**
 * Inspo (screens 29, 30, 33): everything saved, as a grid, browsable by
 * folder — and the folders are the areas. The one place the pictures get to
 * fill the frame and the interface steps back.
 */
export default function InspoView({
  items,
  areas,
  counts,
  folder,
  ready,
  error,
  detail,
}: {
  items: InspoWithPicture[];
  areas: AreaOption[];
  /** How many in each folder ("" is Unsorted). */
  counts: Map<string, number>;
  /** undefined: everything; null: Unsorted; else an area key. */
  folder: string | null | undefined;
  ready: boolean;
  error?: string;
  detail?: string;
}) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const unsorted = counts.get("") ?? 0;
  const current = folder === undefined ? "all" : folder === null ? "unsorted" : folder;
  const title = folder === undefined ? "Inspo" : folder === null ? "Unsorted" : (areas.find((a) => a.key === folder)?.label ?? folder);
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition ${
      active ? "border-ink bg-ink text-ivory" : "glass-card text-ink hover:border-champagne-400"
    }`;
  const newHref = `/inspo/new${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`;

  return (
    <main className="page pb-28 lg:max-w-5xl lg:pb-16">
      <p className="label">Inspo</p>
      <h1 className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em] text-ink">{total === 0 ? "Nothing saved yet." : title}</h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink">
          {error}
          {detail && <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>}
        </p>
      )}
      {!ready && (
        <p className="mt-5 rounded-xl border border-dashed border-champagne-400 px-4 py-3 text-sm text-ink">
          Inspo needs one more database step: run <span className="font-mono text-xs">supabase/migrations/0010_inspo.sql</span> in Supabase.
        </p>
      )}

      {total === 0 ? (
        // Screen 33: the empty gallery, and how to make the first save.
        <div className="glass-card mt-6 max-w-lg rounded-[22px] p-5">
          <p className="text-[15px] leading-relaxed text-stone">
            Dresses, flowers, table ideas, a cake someone posted — save them here as you find them. A photo from your phone,
            or a link from Pinterest or anywhere else. File each under an area and it turns up on that area&apos;s page too.
          </p>
          <Link
            href="/inspo/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-ivory transition hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Save your first idea
          </Link>
        </div>
      ) : (
        <>
          {/* Folders: the areas that have something in them, and Unsorted. */}
          <nav aria-label="Folders" className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1">
            <Link href="/inspo" aria-current={current === "all" ? "page" : undefined} className={chip(current === "all")}>
              Everything <span className="opacity-60">{total}</span>
            </Link>
            {areas
              .filter((a) => counts.get(a.key))
              .map((a) => (
                <Link
                  key={a.key}
                  href={`/inspo?folder=${encodeURIComponent(a.key)}`}
                  aria-current={current === a.key ? "page" : undefined}
                  className={chip(current === a.key)}
                >
                  {a.label} <span className="opacity-60">{counts.get(a.key)}</span>
                </Link>
              ))}
            {unsorted > 0 && (
              <Link href="/inspo?folder=unsorted" aria-current={current === "unsorted" ? "page" : undefined} className={chip(current === "unsorted")}>
                Unsorted <span className="opacity-60">{unsorted}</span>
              </Link>
            )}
          </nav>

          <Link
            href={newHref}
            className="glass-card mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink hover:border-champagne-400"
          >
            <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            Save an idea
          </Link>

          {items.length === 0 ? (
            <p className="mt-8 text-sm text-stone">Nothing in this folder yet.</p>
          ) : (
            <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
              {items.map((item) => (
                <InspoTile key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
