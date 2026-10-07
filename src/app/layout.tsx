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
  appleWebApp: { capable: true, title: "Wedding", statusBarStyle: "default" },
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
