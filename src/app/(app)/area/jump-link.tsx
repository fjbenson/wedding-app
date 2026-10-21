"use client";

/**
 * A link down the page to `#ideas` (the foot's Notes and Inspo tiles, owner
 * 21 Oct 2026) that works even when the address already ends in it: it sets
 * the hash quietly and tells the stages and folds to open, as a hash change
 * would.
 */
export default function JumpLink({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        window.history.replaceState(window.history.state, "", `#${to}`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }}
    >
      {children}
    </a>
  );
}
