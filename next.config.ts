import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [],
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
