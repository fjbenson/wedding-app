"use client";

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
