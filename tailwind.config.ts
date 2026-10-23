import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
  // Hover looks only on devices with a mouse: on a phone a tap left them
  // stuck on until you tapped somewhere else.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF", // cards; highlights on glass
      ivory: "#FBF9F5", // the page, everywhere
      cream: "#F4EFE7", // secondary panels, pressed states
      ground: "#EFE7DA", // the page below the light at the top (body::before in globals.css)
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
        script: ["var(--font-script)", "var(--font-display)", "Georgia", "serif"],
      },
      letterSpacing: {
        label: "0.3em", // the widely spaced small capitals (.label, .section-label)
      },
    },
  },
  plugins: [
    // `room-lg:` / `room-xl:` — the laptop (1024px) and wide-laptop (1280px) layouts,
    // but counted from the room the page really has: while a card sits beside the list
    // (`html[data-card-beside]`, 440px) the list needs 440px more screen before it
    // can use its columns, so it keeps the phone layout until then.
    plugin(({ addVariant }) => {
      // The guest table: it only needs about 700px, so it keeps its columns beside a card from 1400px.
      addVariant("room-md", [
        "@media (min-width: 1024px) { html:not([data-card-beside]) & }",
        "@media (min-width: 1400px) { html[data-card-beside] & }",
      ]);
      addVariant("room-lg", [
        "@media (min-width: 1024px) { html:not([data-card-beside]) & }",
        "@media (min-width: 1464px) { html[data-card-beside] & }",
      ]);
      addVariant("room-xl", [
        "@media (min-width: 1280px) { html:not([data-card-beside]) & }",
        "@media (min-width: 1720px) { html[data-card-beside] & }",
      ]);
    }),
  ],
} satisfies Config;
