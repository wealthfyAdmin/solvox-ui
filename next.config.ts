import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Allow build even if TypeScript errors exist
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Allow build even if ESLint errors exist
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Keep your SVG handling config
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
