import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  /** The main action on a screen. Aim for one per screen. */
  primary:
    "bg-rose-500 text-white shadow-soft hover:bg-rose-600 active:bg-rose-700",
  /** Everything alongside the main action. */
  secondary:
    "bg-surface text-plum-700 border border-hairline shadow-soft hover:bg-sand-50 active:bg-sand-100",
  /** Low-emphasis — toolbar actions, "cancel", inline controls. */
  ghost: "text-plum-600 hover:bg-sand-100 active:bg-sand-200",
  /** Deleting things. Warm brick rather than alarm red. */
  danger: "bg-clay-500 text-white shadow-soft hover:bg-clay-600 active:bg-clay-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

/**
 * The shared button look, as a plain string.
 *
 * Use this when something isn't a <button> but should look like one — most
 * often a Next.js <Link>:
 *
 *   <Link href="/contacts" className={buttonStyles("primary")}>Contacts</Link>
 */
export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center font-medium",
    "transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches the button to the full width of its container. */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", block, className, type, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        // Buttons inside forms submit by default, which surprises people.
        type={type ?? "button"}
        className={buttonStyles(variant, size, cn(block && "w-full", className))}
        {...props}
      />
    );
  },
);
