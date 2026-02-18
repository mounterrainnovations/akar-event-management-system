import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hflfauratacalmqlwdjd.supabase.co",
      },
    ],
  },
};

module.exports = {
  output: "standalone",
};

export default nextConfig;
