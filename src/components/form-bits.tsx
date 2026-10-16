"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { ReturnTo } from "./back-link";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useFormReset } from "./reset-boundary";

/** Shared pieces for the add/edit forms. */

export { INPUT } from "./form-styles";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-ink">
      {label} {hint && <span className="text-stone">({hint})</span>}
      {children}
    </label>
  );
}

export function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[52px] w-full rounded-2xl bg-ink px-4 text-ivory shadow-[0_10px_24px_-12px_rgb(30_27_24/0.5)] transition hover:bg-ink/90 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/** Everything a form would send, as one string, to tell whether it's changed. */
function snapshot(form: HTMLFormElement) {
  return JSON.stringify([...new FormData(form).entries()].map(([k, v]) => [k, typeof v === "string" ? v : v.name]));
}

/**
 * The form's main button, kept in reach (owner, 12 Oct 2026: a date was
 * changed and never saved because Save was below the fold). It sits at the
 * foot of the screen while the form scrolls, on a soft fade of the page,
 * then settles in place at the end of the form.
 *
 * `whenChanged` (editing): it only rises into view once something on the
 * form is different from how it opened — and goes again if it's put back
 * (owner: just looking at a to-do shouldn't show a big Save) — with a
 * Cancel beside it that puts the form back how it opened, staying on it.
 */
export function SubmitBar({
  label,
  whenChanged = false,
  onCancel,
}: {
  label: string;
  whenChanged?: boolean;
  /** Cancel's own job (a card closes itself); otherwise it goes back a screen. */
  onCancel?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reset = useFormReset();
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!whenChanged || !form) return;
    const start = snapshot(form);
    let frame = 0;
    // Taps on quick picks and tiles change the form through React a moment
    // later, so look on the next frame rather than at the event itself.
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setChanged(snapshot(form) !== start));
    };
    const events = ["input", "change", "click", "keyup"] as const;
    events.forEach((e) => form.addEventListener(e, check));
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((e) => form.removeEventListener(e, check));
    };
  }, [whenChanged]);

  const shown = !whenChanged || changed;
  return (
    <div
      ref={ref}
      className={
        shown
          ? `sticky bottom-0 z-20 -mx-[var(--gutter)] mt-8 bg-gradient-to-t from-ivory from-60% to-ivory/0 px-[var(--gutter)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 ${whenChanged ? "rise-in" : ""}`
          : "hidden"
      }
    >
      {whenChanged ? (
        <div className="flex gap-2.5">
          <button
            type="button"
            // Puts the form back how it opened, staying on it (owner, 12 Oct 2026).
            onClick={() => (onCancel ? onCancel() : reset ? reset() : window.history.length > 1 ? router.back() : router.push("/"))}
            className="h-[52px] w-[34%] shrink-0 rounded-2xl border border-champagne-400/70 bg-white text-ink transition hover:bg-cream"
          >
            Cancel
          </button>
          <div className="flex-1">
            <SubmitButton label={label} />
          </div>
        </div>
      ) : (
        <SubmitButton label={label} />
      )}
    </div>
  );
}

/** A quiet "remove" link that asks first, since there's no undo. */
export function RemoveButton({
  action,
  label,
  question,
  returnTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  question: string;
  /** Go back to the view you came from on this screen afterwards (`ReturnTo`). */
  returnTo?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(question)) event.preventDefault();
      }}
    >
      {returnTo && <ReturnTo href={returnTo} />}
      <button
        type="submit"
        className="w-full py-3 text-sm text-stone underline underline-offset-4 hover:text-ink"
      >
        {label}
      </button>
    </form>
  );
}

/** A smaller button for doing something in place, like inviting a household. */
export function InlineSubmit({
  label,
  pendingLabel,
  primary = false,
}: {
  label: string;
  pendingLabel: string;
  primary?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        primary
          ? "w-full rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 disabled:opacity-60"
          : "rounded-full border border-champagne-400 px-3 py-1.5 text-sm text-ink transition hover:bg-champagne-100 disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * A date box that says "Pick a date" while it's empty. An iPhone shows an
 * empty date box as a blank strip with no hint, and a laptop shows
 * "dd/mm/yyyy"; this gives both the same faint hint as the other boxes'
 * placeholders. The laptop's own letters are hidden until the box is in use.
 * A small calendar sits on the right on every device (globals.css hides the
 * laptop's own, but leaves it stretched over the box so a click opens it).
 */
export function DateInput({
  placeholder = "Pick a date",
  className = "",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [filled, setFilled] = useState(!!(props.value ?? props.defaultValue));
  const empty = props.value !== undefined ? !props.value : !filled;
  return (
    <span className="relative block">
      <input
        {...props}
        type="date"
        onChange={(event) => {
          setFilled(!!event.target.value);
          props.onChange?.(event);
        }}
        className={`peer relative ${className} !pr-11 ${empty ? "!text-transparent focus:!text-ink" : ""}`}
      />
      <CalendarDays
        aria-hidden
        strokeWidth={1.6}
        className="pointer-events-none absolute bottom-[15px] right-4 h-5 w-5 text-stone/70"
      />
      {empty && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-[17px] flex h-[3.125rem] items-center text-base text-stone/60 peer-focus:hidden"
        >
          {placeholder}
        </span>
      )}
    </span>
  );
}
