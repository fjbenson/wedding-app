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
  // On an iPhone, "Add to Home Screen" opens it full screen, like an app.
  // The icon is src/app/apple-icon.png; the rest is in manifest.ts.
  // "black-translucent" lets the page run up under the clock (whose text the
  // iPhone then makes white); every screen pads itself clear of the notch.
  appleWebApp: { capable: true, title: "Wedding", statusBarStyle: "black-translucent" },
  // Next writes the newer "mobile-web-app-capable"; iPhones only honour the
  // status-bar style above alongside the older Apple tag, so add it too.
  other: { "apple-mobile-web-app-capable": "yes" },
};

// Fit the phone's width, and let the page reach under the notch and home bar
// so the safe-area spacing in globals.css can keep things clear of them.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The top of the satin background, so the iPhone's status bar blends in
  // when it's opened from the home screen.
  themeColor: "#F6EEE5",
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
