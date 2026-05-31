import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/security-dashboard",
  images: { unoptimized: true },
};

export default nextConfig;
