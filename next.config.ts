import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error turbopack is a valid option in Next.js 16 but missing from types
  experimental: { turbopack: false },
  async redirects() {
    return [
      {
        source: '/real-estate/transaction',
        destination: '/apt',
        permanent: true,
      },
      {
        source: '/real-estate/apt/:sgg_cd/:apt_nm',
        destination: '/apt',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
