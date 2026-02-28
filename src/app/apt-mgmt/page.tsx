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

const FAQ_ITEMS = [
  {
    question: '관리비 지킴이란 무엇인가요?',
    answer:
      '관리비 지킴이는 우리 아파트 관리비가 같은 동·구·서울 전체 평균 대비 어느 수준인지 한눈에 확인할 수 있는 서비스입니다. 관리비 과다 납부 여부를 쉽게 파악할 수 있습니다.',
  },
  {
    question: '어떤 데이터를 사용하나요?',
    answer:
      'K-apt(공동주택관리정보시스템)에서 공개하는 공공데이터를 기반으로 합니다. 서울 전체 아파트 단지의 공식 관리비 공시 데이터를 매월 업데이트합니다.',
  },
  {
    question: '관리비는 어떻게 계산되나요?',
    answer:
      '관리비는 공용관리비(경비비·청소비·엘리베이터 유지비 등)와 개인 사용료(난방·전기·수도 등)로 구성됩니다. 본 서비스는 세대당 월 관리비(원/세대)를 기준으로 비교합니다.',
  },
  {
    question: '내 아파트 관리비가 비싼지 어떻게 알 수 있나요?',
    answer:
      '아파트 이름을 검색하면 해당 단지의 관리비가 동·구·서울 전체 몇 번째 수준인지 백분율과 등급(A~E)으로 표시됩니다. 상위 20% 이내면 A등급(절약), 하위 20%면 E등급(과다)입니다.',
  },
  {
    question: '서울 아파트 평균 관리비는 얼마인가요?',
    answer:
      '최신 K-apt 데이터 기준 서울 아파트 세대당 평균 관리비는 약 7~9만원 수준입니다. 단지 규모·난방 방식·준공연도에 따라 편차가 크며, 아파트를 검색하면 실시간 평균값을 확인할 수 있습니다.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
};

export default function AptMgmtPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="text-center my-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-2xl mb-4">
          <span className="text-2xl">🏠</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">관리비 지킴이</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          우리 아파트 관리비가 동네·구·서울 평균 대비 어느 수준인지 확인하세요
        </p>
      </header>

      <main className="space-y-6">
        <AptMgmtSearchForm />

        <section className="text-sm text-gray-500 dark:text-gray-400 space-y-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-5 text-center">
          <h2 className="font-medium text-gray-700 dark:text-gray-300">이런 분께 유용합니다</h2>
          <ul className="space-y-1.5">
            <li>관리비가 너무 많이 나오는 것 같은 분</li>
            <li>이사 전 아파트 관리비 수준을 미리 확인하고 싶은 분</li>
            <li>경비비·청소비 등 항목별 비교가 필요한 분</li>
          </ul>
        </section>

        <section aria-label="자주 묻는 질문" className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">자주 묻는 질문</h2>
          <dl className="space-y-2">
            {FAQ_ITEMS.map(({ question, answer }) => (
              <details
                key={question}
                className="group bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-medium text-gray-800 dark:text-gray-200 list-none">
                  <dt>{question}</dt>
                  <span className="ml-3 shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <dd className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {answer}
                </dd>
              </details>
            ))}
          </dl>
        </section>

      </main>
    </div>
  );
}
