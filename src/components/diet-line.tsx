import { WheatOff } from "lucide-react";

/** A guest's dietary needs under their name, in rose with the no-wheat mark. */
export default function DietLine({ needs }: { needs: string[] }) {
  return (
    <span className="mt-0.5 flex items-center gap-1 text-[13px] text-[#9A3F2B]">
      <WheatOff aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
      <span className="min-w-0">{needs.join(" · ")}</span>
    </span>
  );
}
