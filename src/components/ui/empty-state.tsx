import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * What a screen shows before there's anything on it.
 *
 * Worth doing properly — a new user sees these before they see anything else,
 * so each one says what the thing is and gives them the button to start.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl",
        "border border-dashed border-sand-300 bg-sand-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      {/* A quiet ring rather than an illustration — nothing to commission. */}
      <span
        aria-hidden="true"
        className="mb-4 h-10 w-10 rounded-full border-2 border-rose-200"
      />
      <h3 className="text-lg font-medium text-plum-800">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
