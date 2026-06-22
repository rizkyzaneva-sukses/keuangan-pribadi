import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  deploymentId:
    process.env.DEPLOYMENT_VERSION ||
    process.env.DEPLOYMENT_ID ||
    process.env.GIT_SHA,
};

export default nextConfig;
