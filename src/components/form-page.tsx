import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** The frame around the add and edit forms: a way back, a title, any error. */
export default function FormPage({
  backHref,
  backLabel,
  title,
  error,
  detail,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  error?: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page pb-16">
      <Link
        href={backHref}
        className="-ml-1 inline-flex items-center gap-1 py-2 text-sm text-stone hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        {backLabel}
      </Link>

      <h1 className="mt-4 text-[30px] leading-tight tracking-[-0.02em] text-ink">{title}</h1>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-champagne-400 bg-cream px-4 py-3 text-sm text-ink"
        >
          {error}
          {detail && (
            <span className="mt-2 block break-words font-mono text-xs text-stone">{detail}</span>
          )}
        </p>
      )}

      <div className="mt-8">{children}</div>
    </main>
  );
}
