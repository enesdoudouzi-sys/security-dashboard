import type { NextConfig } from "next";

const isGithubPages = process.env.DEPLOY_TARGET === "github";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? "/security-dashboard" : "",
  images: { unoptimized: true },
};

export default nextConfig;
