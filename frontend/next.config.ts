import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "hflfauratacalmqlwdjd.supabase.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/supabase-api/:path*",
        destination: "https://hflfauratacalmqlwdjd.supabase.co/:path*",
      },
    ];
  },
};

export default nextConfig;
