/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  reactStrictMode: true,
  experimental: {
    fetchCache: 'force-no-store',
  },
};

module.exports = nextConfig;
