import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
