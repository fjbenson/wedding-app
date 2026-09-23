import type { Config } from "tailwindcss";

/**
 * Warm and romantic: cream paper, dusty rose, deep plum ink.
 *
 * One rule — nothing pure white, nothing pure black. That is what keeps it
 * from feeling like a banking app.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FDF6F0", // the page
        card: "#FFFCFA", // panels sitting on it
        ink: "#42272E", // headings and body text
        muted: "#8A7168", // captions, borders, the quiet things
        rose: {
          50: "#FBEFEA",
          100: "#F4D9CF",
          200: "#E9B6A5",
          300: "#DD9279",
          400: "#D4816A",
          500: "#CB705A", // primary — buttons, links, the thing to press
          600: "#B15C48",
          700: "#8E4838",
        },
        sage: "#6E8862",
        gold: "#C89740",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
