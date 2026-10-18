"use client";

import { usePathname } from "next/navigation";
import AssistantSheet from "@/components/assistant/assistant-sheet";
import { NAV } from "@/lib/nav";

/**
 * "Jot or ask" on phones: a small glass pen sitting above the menu bar, on
 * the same screens the menu bar shows, opening Your assistant. Desktops use
 * the top bar's pen.
 */
export default function CaptureButton() {
  const pathname = usePathname();
  // The home screen has its own, just under the ring.
  if (pathname === "/" || !NAV.some((tab) => tab.href === pathname)) return null;
  return <AssistantSheet variant="fab" />;
}
