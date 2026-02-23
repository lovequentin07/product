import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서울 아파트 실거래가 조회 | DataZip',
  description: '국토교통부 공공데이터 기반 서울 아파트 실거래가 조회 서비스. 강남구, 서초구, 송파구 등 서울 전 지역 아파트 매매 실거래가를 확인하세요.',
};

export default function Home() {
  return (
    <meta httpEquiv="refresh" content="0; url=/apt" />
  );
}
