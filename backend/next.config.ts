import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, 
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
