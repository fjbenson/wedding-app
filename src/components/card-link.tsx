"use client";

import Link from "next/link";
import { replaceQuery } from "@/lib/url-state";

/**
 * A row's tap. A to-do (/plan/<id>) or an appointment (/plan/appointments/<id>)
 * opens as a card over the page you're on (`PlanCards`, owner 16 Oct 2026);
 * anything else is an ordinary link. The href stays real, so a long press or
 * a new tab still opens the full page.
 */
export default function CardLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const appointment = href.match(/^\/plan\/appointments\/([0-9a-f-]{36})$/i)?.[1];
  const todo = appointment ? undefined : href.match(/^\/plan\/([0-9a-f-]{36})$/i)?.[1];
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (!todo && !appointment) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        replaceQuery(todo ? { todo, appointment: null } : { appointment: appointment!, todo: null });
      }}
    >
      {children}
    </Link>
  );
}
