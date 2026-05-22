import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['showroom-syrup-plop.ngrok-free.dev'],
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
