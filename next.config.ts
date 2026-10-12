import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Speed (owner, 12 Oct 2026: "tapping a new page… takes a while"). The
  // phone keeps each screen it has shown or fetched ahead for a short while,
  // so going back to a tab is instant rather than asking the server again.
  // Any save (a server action that revalidates) clears this, so your own
  // changes always show straight away; a partner's edits on another phone
  // can take up to a minute to appear.
  experimental: {
    staleTimes: { dynamic: 30, static: 60 },
  },
  // The tabs were renamed to match docs/information-architecture.md
  // (30 Sep 2026). Old links and bookmarks still land in the right place.
  async redirects() {
    return [
      { source: "/guests", destination: "/people", permanent: true },
      { source: "/guests/:path*", destination: "/people/:path*", permanent: true },
      { source: "/timeline", destination: "/plan", permanent: true },
      { source: "/timeline/:path*", destination: "/plan/:path*", permanent: true },
      { source: "/rsvps", destination: "/people", permanent: true },
      // Invitation tracking was taken out (9 Oct 2026); sending them is a Stationery job.
      { source: "/invitations", destination: "/people", permanent: false },
    ];
  },
};

export default nextConfig;
