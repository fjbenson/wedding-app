"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { suggestNeeds } from "@/lib/dietary";

/**
 * Picking a guest's dietary needs (owner, 14 Oct 2026): their needs as
 * pills (tap ✕ to take one off), and a box that finds the standard ones as
 * you type ("veggie" → Vegetarian) — tap one to add it. Only when nothing
 * matches does "+ Add 'no mushrooms'" appear, so the couple pick from the
 * list wherever they can and the guest list can count them by type.
 * The box shows the whole list as soon as it's tapped.
 */
export default function DietaryPicker({
  value,
  onChange,
  own,
  disabled = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  /** The wedding's own needs, from other guests — offered here too. */
  own: string[];
  disabled?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = suggestNeeds(typed, own, value);
  const custom = typed.trim();
  // Closing waits a moment, so a tap on a suggestion lands before the list goes.
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);

  const add = (need: string) => {
    clearTimeout(closing.current);
    onChange([...value, need]);
    setTyped("");
  };
  // Keep the box focused while tapping a suggestion, where the browser allows.
  const keep = (event: React.MouseEvent) => event.preventDefault();

  const pill = "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition";

  return (
    <div className="py-2">
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((need) => (
            <button
              key={need}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.filter((n) => n !== need))}
              aria-label={`${need} — take off`}
              className={`${pill} border-champagne-600 bg-champagne-100 font-medium text-champagne-600`}
            >
              {need}
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          ))}
        </div>
      )}

      <input
        value={typed}
        disabled={disabled}
        onChange={(event) => setTyped(event.target.value)}
        onFocus={() => {
          clearTimeout(closing.current);
          setOpen(true);
        }}
        onBlur={() => {
          closing.current = setTimeout(() => setOpen(false), 200);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (suggestions.length > 0 && custom) add(suggestions[0]);
            else if (suggestions.length === 0 && custom) add(custom);
          } else if (event.key === "Escape") {
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
            setTyped("");
            (event.target as HTMLInputElement).blur();
          }
        }}
        autoComplete="off"
        aria-label="Find a dietary need"
        placeholder={value.length ? "Add another, e.g. nut allergy" : "Type to find, e.g. veggie"}
        className="h-10 w-full rounded-full border border-linen bg-white px-4 text-[15px] text-ink placeholder:text-stone/60 focus:border-champagne-400 focus:outline-none focus:ring-2 focus:ring-champagne-400/30"
      />

      {open && (
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((need) => (
            <button
              key={need}
              type="button"
              onMouseDown={keep}
              onClick={() => add(need)}
              className={`${pill} border-linen bg-white text-ink hover:border-champagne-400`}
            >
              {need}
            </button>
          ))}
          {suggestions.length === 0 && custom && (
            <button
              type="button"
              onMouseDown={keep}
              onClick={() => add(custom)}
              className={`${pill} border-dashed border-champagne-400 text-champagne-600 hover:bg-champagne-100`}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Add &lsquo;{custom}&rsquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
