import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The tabs were renamed to match docs/information-architecture.md
  // (30 Sep 2026). Old links and bookmarks still land in the right place.
  async redirects() {
    return [
      { source: "/guests", destination: "/people", permanent: true },
      { source: "/guests/:path*", destination: "/people/:path*", permanent: true },
      { source: "/timeline", destination: "/plan", permanent: true },
      { source: "/timeline/:path*", destination: "/plan/:path*", permanent: true },
      { source: "/rsvps", destination: "/people", permanent: true },
    ];
  },
};

export default nextConfig;
