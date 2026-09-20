import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/** The shared look for anything you type or choose in. */
const controlStyles = cn(
  "w-full rounded-xl border bg-surface px-3.5 text-sm text-ink",
  "placeholder:text-ink-subtle",
  "transition-colors duration-150",
  "disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-ink-subtle",
);

const controlBorder = "border-sand-300 hover:border-sand-400";
const controlBorderInvalid = "border-clay-500 hover:border-clay-600";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        controlStyles,
        "h-11",
        invalid ? controlBorderInvalid : controlBorder,
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        controlStyles,
        "py-2.5 leading-relaxed",
        invalid ? controlBorderInvalid : controlBorder,
        className,
      )}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, ...props }, ref) {
  // `appearance-none` removes the browser's own arrow, so we draw our own and
  // sit it on top. The wrapper is only there to position it.
  return (
    <span className="relative block">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlStyles,
          "h-11 appearance-none pr-10",
          invalid ? controlBorderInvalid : controlBorder,
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
});

/**
 * Wraps a control with its label, hint and error message, and wires up the
 * ids so screen readers read them together.
 *
 * It hands the control everything it needs — spread it and add the rest:
 *
 *   <Field label="Email" hint="We'll only use this for RSVPs.">
 *     {(props) => <Input {...props} type="email" />}
 *   </Field>
 */

/** What Field passes down to whatever control it wraps. */
export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  invalid?: boolean;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (props: FieldControlProps) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Point the control at whichever message is actually on screen, so a screen
  // reader announces the label and then the hint or the error.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-plum-700"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-clay-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children({ id, "aria-describedby": describedBy, invalid: Boolean(error) })}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-clay-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
