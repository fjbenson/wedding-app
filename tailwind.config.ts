import type { Config } from "tailwindcss";

/**
 * The design system's single source of truth.
 *
 * Every colour, font and shadow the app uses is named here. Screens use the
 * names (`bg-rose-500`, `text-ink`, `shadow-soft`) and never raw hex codes —
 * so changing the look means editing this file, not hunting through screens.
 *
 * Direction: "warm and romantic" — cream paper, dusty rose, deep plum ink,
 * sage and gold as quiet accents. Nothing pure white, nothing pure black.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Dusty rose — the primary colour. Buttons, links, the active state. */
        rose: {
          50: "#FDF5F3",
          100: "#FBE9E4",
          200: "#F5D3C9",
          300: "#ECB4A5",
          400: "#DE8E79",
          500: "#CB705A",
          600: "#B45745",
          700: "#954338",
          800: "#7A3830",
          900: "#64302B",
        },
        /** Deep plum — headings and body text. Warmer and softer than black. */
        plum: {
          50: "#F7F2F3",
          100: "#EDE0E3",
          200: "#DBC2C8",
          300: "#C09AA3",
          400: "#9E6C78",
          500: "#7E4C57",
          600: "#663C46",
          700: "#523039",
          800: "#42272E",
          900: "#351F25",
        },
        /** Sage — the secondary accent. Confirmed, done, good news. */
        sage: {
          50: "#F4F7F2",
          100: "#E7EDE3",
          200: "#CFDBC8",
          300: "#AFC2A5",
          400: "#8BA37F",
          500: "#6E8862",
          600: "#566D4D",
          700: "#45573E",
          800: "#394734",
          900: "#2F3B2C",
        },
        /** Gold — small celebratory touches. Use sparingly or it looks cheap. */
        gold: {
          50: "#FDF9F0",
          100: "#F9F0DC",
          200: "#F2DFB6",
          300: "#E7C886",
          400: "#DAB05C",
          500: "#C89740",
          600: "#AC7C33",
          700: "#8B602C",
        },
        /** Warm neutrals. Backgrounds, borders, muted text. */
        sand: {
          50: "#FDFBF9",
          100: "#F8F3EE",
          200: "#EFE6DD",
          300: "#E1D3C6",
          400: "#C4B0A0",
          500: "#A08B7B",
          600: "#7E6A5C",
          700: "#5F4F44",
          800: "#43382F",
          900: "#2B231D",
        },
        /** Muted brick red. Declined, errors, destructive actions. */
        clay: {
          50: "#FDF4F3",
          100: "#FAE5E3",
          200: "#F2C8C4",
          500: "#B4453F",
          600: "#9B3A35",
          700: "#7E302C",
        },

        // Semantic shortcuts — prefer these in screens.
        /** Page background. */
        canvas: "#FDF6F0",
        /** Cards and panels sitting on the canvas. */
        surface: "#FFFFFF",
        /** Default text colour. */
        ink: "#42272E",
        /** Secondary text — captions, hints, metadata. */
        "ink-muted": "#7E6A5C",
        /** Tertiary text — timestamps, placeholders. */
        "ink-subtle": "#A08B7B",
        /** Default border. */
        hairline: "#EFE6DD",
      },

      fontFamily: {
        // Body and UI text.
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Headings and the couple's names. The romantic half of the pairing.
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },

      fontSize: {
        // A display scale for headings, separate from Tailwind's defaults.
        "display-sm": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-md": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-xl": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },

      borderRadius: {
        // Softer than Tailwind's defaults — corners are part of "romantic".
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },

      boxShadow: {
        // Warm-tinted shadows. A grey shadow on cream paper looks dirty.
        soft: "0 1px 2px rgba(67, 56, 47, 0.04), 0 4px 12px rgba(67, 56, 47, 0.06)",
        lifted: "0 2px 4px rgba(67, 56, 47, 0.05), 0 12px 28px rgba(67, 56, 47, 0.10)",
        ring: "0 0 0 3px rgba(203, 112, 90, 0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
