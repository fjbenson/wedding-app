import Link from "next/link";
import CardLink from "@/components/card-link";
import { ExternalLink } from "lucide-react";
import AddButton from "@/components/add-button";
import { areaIcon, type AreaOption } from "@/lib/areas";
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
    <CardLink href={`/inspo/${item.id}`} className="glass-card group mb-3 block break-inside-avoid overflow-hidden rounded-2xl">
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
    </CardLink>
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
  const title = folder === undefined ? "Inspo" : folder === null ? "Unsorted" : folder === "other" ? "Other" : (areas.find((a) => a.key === folder)?.label ?? folder);
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition ${
      active ? "border-champagne-400 bg-champagne-100 text-ink" : "glass-card text-ink hover:border-champagne-400"
    }`;
  const newHref = `/inspo/new${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`;

  return (
    <main className="page pb-28 lg:max-w-5xl lg:pb-16">
      <div className="mt-3 flex items-center justify-between gap-3">
        <h1 className="type-display text-[32px] leading-[1.1] tracking-[-0.02em]">{title}</h1>
        <AddButton href={newHref} label="Save an idea" />
      </div>

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
        // Screen 33, empty: the shape of the gallery from the wedding's own areas
        // ("an empty screen still shows its shape"), each a faded square that saves an idea to it.
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {areas.map((a) => {
            const Icon = areaIcon(a.key, a.icon);
            return (
              <Link
                key={a.key}
                href={`/inspo/new?folder=${encodeURIComponent(a.key)}`}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-champagne-400/70 bg-white/35 text-center hover:bg-white/60"
              >
                <Icon aria-hidden className="h-6 w-6 text-champagne-600/70" strokeWidth={1.6} />
                <span className="font-display text-[15px] italic text-stone">{a.label}</span>
              </Link>
            );
          })}
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
            {(counts.get("other") ?? 0) > 0 && (
              <Link href="/inspo?folder=other" aria-current={current === "other" ? "page" : undefined} className={chip(current === "other")}>
                Other <span className="opacity-60">{counts.get("other")}</span>
              </Link>
            )}
            {unsorted > 0 && (
              <Link href="/inspo?folder=unsorted" aria-current={current === "unsorted" ? "page" : undefined} className={chip(current === "unsorted")}>
                Unsorted <span className="opacity-60">{unsorted}</span>
              </Link>
            )}
          </nav>


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
