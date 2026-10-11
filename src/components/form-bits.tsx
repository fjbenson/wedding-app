"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useFormStatus } from "react-dom";

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
      className="w-full rounded-xl bg-ink px-4 py-3 text-ivory transition hover:bg-ink/90 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/** A quiet "remove" link that asks first, since there's no undo. */
export function RemoveButton({
  action,
  label,
  question,
}: {
  action: () => void | Promise<void>;
  label: string;
  question: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(question)) event.preventDefault();
      }}
    >
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
