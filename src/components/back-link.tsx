"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lastView } from "@/lib/last-view";

/**
 * A link back to `href`, or to the view you last had there (the List, a
 * month, a filter — src/lib/last-view.ts). Also gives a form a hidden
 * `return_to` so its Save lands in the same place (`returnTo()`).
 */
export function useLastView(href: string) {
  const [view, setView] = useState(href);
  useEffect(() => setView(lastView(href)), [href]);
  return view;
}

export default function BackLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={useLastView(href)} className={className}>
      {children}
    </Link>
  );
}

/** A hidden field for a form whose Save should go back to the view you came from. */
export function ReturnTo({ href }: { href: string }) {
  return <input type="hidden" name="return_to" value={useLastView(href)} />;
}
