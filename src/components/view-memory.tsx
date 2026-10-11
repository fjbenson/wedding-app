"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { rememberView } from "@/lib/last-view";

/** Records each screen's current view (src/lib/last-view.ts). Draws nothing. */
function Record() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    // Forms aren't views to come back to; nor are error messages.
    if (/\/(new|edit)$/.test(pathname) || /(^|&)error=/.test(search)) return;
    rememberView(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);
  return null;
}

export default function ViewMemory() {
  return (
    <Suspense fallback={null}>
      <Record />
    </Suspense>
  );
}
