"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine } from "lucide-react";
import { NAV } from "@/lib/nav";

/**
 * Quick capture on phones: a small glass button sitting above the menu bar,
 * on the same screens the menu bar shows. Desktops use the sidebar's button.
 */
export default function CaptureButton() {
  const pathname = usePathname();
  if (!NAV.some((tab) => tab.href === pathname)) return null;

  return (
    <Link
      href={`/capture?from=${encodeURIComponent(pathname)}`}
      aria-label="Capture something"
      className="glass fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+60px)] right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full text-ink md:bottom-[84px] lg:hidden"
    >
      <PenLine className="h-5 w-5" strokeWidth={1.8} aria-hidden />
    </Link>
  );
}
