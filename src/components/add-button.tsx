import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * The round black + — the one way to add on a tab (Guests, Suppliers, Plan,
 * Money). One size everywhere: 40px, the size it first had on Money's By
 * month (owner, 12 Oct 2026: "perfect size, use this as a standard"). A
 * search box beside it is 40px tall too. It keeps its soft shadow (owner).
 */
export default function AddButton({ href, onClick, label }: { href?: string; onClick?: () => void; label: string }) {
  const className =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-ivory shadow-[0_10px_24px_-10px_rgb(30_27_24/0.6)] transition hover:bg-ink/90";
  const plus = <Plus className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />;
  // A button when it opens something on the same screen (Travel's places to stay).
  if (onClick || !href) {
    return (
      <button type="button" onClick={onClick} aria-label={label} className={className}>
        {plus}
      </button>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {plus}
    </Link>
  );
}
