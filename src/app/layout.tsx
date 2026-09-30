import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

// Fraunces Light for headlines and big numbers; Geist for everything else.
const display = Fraunces({
  subsets: ["latin"],
  weight: "300",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Wedding App",
  description: "Plan a wedding — contacts, timeline and RSVPs in one place.",
};

// Fit the phone's width, and let the page reach under the notch and home bar
// so the safe-area spacing in globals.css can keep things clear of them.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF9F5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-ivory font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
