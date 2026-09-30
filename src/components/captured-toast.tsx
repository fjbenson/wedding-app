"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

/**
 * "Saved" after a quick capture, on whichever screen it was captured from.
 * Clears ?captured=1 from the address so a refresh doesn't show it again.
 */
export default function CapturedToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (params.get("captured") !== "1") return;
    setShown(true);
    const rest = new URLSearchParams(params);
    rest.delete("captured");
    router.replace(rest.size ? `${pathname}?${rest}` : pathname, { scroll: false });
    const timer = setTimeout(() => setShown(false), 3500);
    return () => clearTimeout(timer);
  }, [params, pathname, router]);

  if (!shown) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-20 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-ivory shadow-lg"
    >
      <Check className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden />
      <span className="flex-1">Saved.</span>
      <Link href="/inbox" className="underline underline-offset-4">
        Inbox
      </Link>
    </div>
  );
}
