"use client";

import Link from "next/link";
import { replaceQuery } from "@/lib/url-state";

/**
 * A row's tap. A to-do (/plan/<id>), an appointment (/plan/appointments/<id>)
 * a payment (/money/payments/<id>), a run sheet moment (/day/run-sheet/<id>)
 * or an Inspo idea (/inspo/<id>) opens as a card over the page you're on (`PlanCards`, owner 16 Oct 2026);
 * anything else is an ordinary link. The href stays real, so a long press or
 * a new tab still opens the full page.
 */
export default function CardLink({
  href,
  className,
  children,
  onOpen,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** Also run on a tap (e.g. the assistant closes itself so the card shows). */
  onOpen?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "onClick">) {
  const appointment = href.match(/^\/plan\/appointments\/([0-9a-f-]{36})$/i)?.[1];
  const todo = appointment ? undefined : href.match(/^\/plan\/([0-9a-f-]{36})$/i)?.[1];
  const payment = href.match(/^\/money\/payments\/([0-9a-f-]{36})$/i)?.[1];
  const moment = href.match(/^\/day\/run-sheet\/([0-9a-f-]{36})$/i)?.[1];
  const idea = href.match(/^\/inspo\/([0-9a-f-]{36})$/i)?.[1];
  return (
    <Link
      {...rest}
      href={href}
      className={className}
      onClick={(event) => {
        onOpen?.();
        if (!todo && !appointment && !payment && !moment && !idea) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        replaceQuery({ todo: todo ?? null, appointment: appointment ?? null, payment: payment ?? null, moment: moment ?? null, idea: idea ?? null });
      }}
    >
      {children}
    </Link>
  );
}
