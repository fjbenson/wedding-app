import type { Config } from "tailwindcss";

/**
 * An ivory wedding magazine. See docs/DESIGN.md for the reasoning.
 *
 * Ivory is the paper, champagne is the detail, ink is the rare accent —
 * roughly 90 / 8 / 2 by area.
 *
 * Replaces Tailwind's colours rather than extending them, so an off-palette
 * `bg-rose-500` fails to exist instead of quietly working.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF", // cards; highlights on glass
      ivory: "#FBF9F5", // the page, everywhere
      cream: "#F4EFE7", // secondary panels, pressed states
      linen: "#E6E0D6", // hairline dividers between rows
      champagne: {
        100: "#F1E7D4", // "done" fills
        400: "#B8914F", // fine lines only — never text (~2.9:1 on ivory)
        600: "#8E6A2C", // champagne text: small-caps labels, list numbers
      },
      ink: "#1E1B18", // headlines, body, the rare solid fill
      stone: "#6B655E", // secondary text: dates, counts
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.3em", // the widely spaced small capitals (.label, .section-label)
      },
    },
  },
  plugins: [],
} satisfies Config;
