/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting is run separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Server Actions body size limit bumped so document/photo uploads work.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
