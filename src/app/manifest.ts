import type { MetadataRoute } from "next";

/**
 * Lets the app be added to a phone's home screen and open full screen, with
 * no browser bars — "standalone". The icons are the hub ring on satin
 * (drawn by a script; regenerate rather than hand-edit).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wedding App",
    short_name: "Wedding",
    description: "Plan a wedding — contacts, timeline and RSVPs in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6EEE4",
    theme_color: "#F6EEE5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
