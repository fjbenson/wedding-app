import { cn } from "@/lib/cn";

/** First letters of a name — "Frankie Benson" becomes "FB". */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

/**
 * A circle with someone's initials. No photo uploads in the MVP, and initials
 * look intentional in a way that a generic silhouette doesn't.
 */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-rose-100 font-medium text-rose-700",
        sizes[size],
        className,
      )}
      // The name is already shown next to this everywhere we use it.
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
