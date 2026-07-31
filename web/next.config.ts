import type { NextConfig } from "next";

// Static export: the site stays a pile of files a Cloudflare Worker can
// serve from an assets directory, exactly like /site today.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
