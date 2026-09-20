import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The title block at the top of a screen. Every screen uses this, so they all
 * start at the same size and spacing.
 */
export function PageHeader({
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
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-display-sm sm:text-display-md text-plum-800">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-prose text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
