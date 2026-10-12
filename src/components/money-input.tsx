"use client";

import { useState } from "react";
import { withCommas } from "@/lib/money";

/**
 * A box for an amount that adds a comma every thousand as you type ("8500"
 * shows "8,500"; owner, 12 Oct 2026). It sends what it shows, and the save
 * reads it with `parseMoney`, which ignores the commas.
 */
export default function MoneyInput({
  name,
  defaultValue,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "value" | "onChange" | "type"> & {
  name: string;
  defaultValue?: number | null;
}) {
  const [value, setValue] = useState(defaultValue != null ? withCommas(String(defaultValue)) : "");
  return (
    <input
      {...rest}
      name={name}
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => setValue(withCommas(e.target.value))}
      className={className}
    />
  );
}
