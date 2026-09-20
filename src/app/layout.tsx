import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

/**
 * Two fonts, loaded once here.
 *
 * Cormorant Garamond is the romantic serif — headings, names, dates.
 * DM Sans is the workhorse — buttons, labels, anything you have to read fast.
 *
 * Next.js downloads these at build time and serves them from our own domain,
 * so there's no flash of the wrong font and nothing is requested from Google
 * when someone opens the app.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wedding App",
  description: "Plan a wedding — contacts, timeline and RSVPs in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
