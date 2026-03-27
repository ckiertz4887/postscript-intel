import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We set a generous timeout for our API routes since scraping
  // multiple sites can take a while
  serverExternalPackages: ["cheerio"],
};

export default nextConfig;
