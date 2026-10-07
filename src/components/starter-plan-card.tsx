import Link from "next/link";
import { addStarterPlanAction } from "@/app/(app)/plan/actions";

/**
 * Shown where the plan would be, before there's anything in it: offers the
 * starter list, or a way to add your own.
 */
export default function StarterPlanCard({
  returnTo,
  hasDate,
  glass = false,
}: {
  returnTo: "/" | "/plan";
  hasDate: boolean;
  /** On the home screen it matches the other glass cards there. */
  glass?: boolean;
}) {
  return (
    <div
      className={
        glass
          ? "glass-card rounded-[22px] p-6"
          : "rounded-3xl border border-linen bg-white p-6 shadow-[0_10px_30px_-18px_rgb(30_27_24/0.25)]"
      }
    >
      <p className="label">Start your plan</p>
      <h3 className="mt-3 text-[22px] leading-snug text-ink">
        Begin with the usual to-dos, then make them yours.
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone">
        Fourteen things most weddings need — the venue, the photographer, the invitations
        {hasDate ? ", each dated back from your day" : ""}. Change or remove anything.
      </p>

      <form action={addStarterPlanAction.bind(null, returnTo)} className="mt-5">
        <button
          type="submit"
          className="w-full rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90"
        >
          Add the starter list
        </button>
      </form>
      <Link
        href="/plan/new"
        className="mt-3 block text-center text-sm text-stone underline underline-offset-4 hover:text-ink"
      >
        Or add your own to-do
      </Link>
    </div>
  );
}
