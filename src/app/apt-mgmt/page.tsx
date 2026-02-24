// src/app/apt-mgmt/page.tsx
// 관리비 지킴이 랜딩 페이지

import type { Metadata } from 'next';
import AptMgmtSearchForm from '@/components/apt-mgmt/AptMgmtSearchForm';

export const metadata: Metadata = {
  title: '관리비 지킴이 - 우리 아파트 관리비 비교 분석',
  description:
    '우리 아파트 관리비가 동네 · 구 · 서울 전체 대비 어느 수준인지 한눈에 확인하세요. K-apt 공시 데이터 기반 실제 관리비 비교 서비스.',
  keywords: ['아파트 관리비', '관리비 비교', '서울 아파트 관리비', '공동주택 관리비', 'K-apt'],
  alternates: { canonical: '/apt-mgmt' },
  openGraph: {
    title: '관리비 지킴이 - 우리 아파트 관리비 비교',
    description: 'K-apt 공시 데이터로 우리 아파트 관리비 수준을 서울 전체와 비교해보세요.',
    url: '/apt-mgmt',
  },
};

const searchActionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DataZip 관리비 지킴이',
  url: 'https://datazip.net/apt-mgmt',
};

export default function AptMgmtPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
      />

      <header className="text-center my-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
          <span className="text-2xl">🏠</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">관리비 지킴이</h1>
        <p className="text-gray-500 mt-2">
          우리 아파트 관리비가 동네·구·서울 평균 대비 어느 수준인지 확인하세요
        </p>
      </header>

      <main className="space-y-6">
        <AptMgmtSearchForm />

        <section className="text-sm text-gray-500 space-y-3 bg-gray-50 rounded-xl p-5">
          <h2 className="font-medium text-gray-700">이런 분께 유용합니다</h2>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>관리비가 너무 많이 나오는 것 같은 분</li>
            <li>이사 전 아파트 관리비 수준을 미리 확인하고 싶은 분</li>
            <li>경비비·청소비 등 항목별 비교가 필요한 분</li>
          </ul>
        </section>

        <section className="text-sm text-gray-400 space-y-1">
          <p>• 데이터 출처: K-apt 공동주택관리정보시스템 공시 데이터</p>
          <p>• 기준: 가장 최근 공시월 기준 세대당 월 평균</p>
          <p>• 서울특별시 전체 공동주택 약 3,000개 단지 비교</p>
        </section>
      </main>
    </div>
  );
}
