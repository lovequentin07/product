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
      // opengraph-image 라우트 삭제 후 Google이 기존 URL 크롤링 중 → middleware 미작동 시 fallback
      {
        source: '/:path*/opengraph-image',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
