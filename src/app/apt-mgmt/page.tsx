// src/app/apt-mgmt/page.tsx
// 관리비 지킴이 랜딩 페이지

import type { Metadata } from 'next';
import AptMgmtSearchForm from '@apt-mgmt/components/AptMgmtSearchForm';
import ServiceLayout from '@shared/components/ui/ServiceLayout';

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

const USE_CASES = [
  {
    icon: '💸',
    title: '관리비가 너무 비싼 것 같을 때',
    desc: '이웃 단지 대비 얼마나 비싼지 등급으로 바로 확인',
  },
  {
    icon: '🏘️',
    title: '이사 전 관리비 사전 점검',
    desc: '입주 전 관리비 수준을 서울 전체와 비교해 예산 계획',
  },
  {
    icon: '📊',
    title: '항목별 상세 비교',
    desc: '경비비·청소비·엘리베이터 등 세부 항목까지 분석',
  },
];

export default function AptMgmtPage() {
  return (
    <ServiceLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <header className="text-center mb-6 pt-2">
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--ds-ink)' }}>
          관리비 지킴이
        </h1>
        <p className="text-base mb-5" style={{ color: 'var(--ds-ink-muted)' }}>
          우리 아파트 관리비가 동네·구·서울 평균 대비 어느 수준인지 확인하세요
        </p>

        {/* 3가지 포인트 */}
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {[
            { icon: '📍', text: '동·구·서울 3단계 비교' },
            { icon: '🏅', text: 'A~E 등급으로 한눈에' },
            { icon: '📅', text: 'K-apt 매월 업데이트' },
          ].map(({ icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'var(--ds-accent-faint)',
                color: 'var(--ds-accent)',
              }}
            >
              <span>{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </header>

      <main className="space-y-6">
        {/* 검색 폼 카드 */}
        <section
          className="rounded-2xl p-6 shadow-md"
          style={{
            background: 'var(--ds-cream-card)',
            border: '1px solid var(--ds-cream-border)',
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ds-ink)' }}>
            아파트 관리비 분석
          </h2>
          <AptMgmtSearchForm />
        </section>

        {/* 이런 분께 유용합니다 — 3개 카드 그리드 */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--ds-ink-faint)' }}
          >
            이런 분께 유용합니다
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {USE_CASES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--ds-cream-card)',
                  border: '1px solid var(--ds-cream-border)',
                }}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-ink)' }}>
                  {title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-ink-muted)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 만든 이유 */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--ds-ink-faint)' }}
          >
            이 서비스를 만든 이유
          </h2>
          <div
            className="rounded-xl p-5"
            style={{
              background: 'var(--ds-cream-card)',
              border: '1px solid var(--ds-cream-border)',
            }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-ink)' }}>
              우리 아파트 관리비, 비싼 걸까요?
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ds-ink-muted)' }}>
              매달 청구서를 받으면서도 알 수가 없었습니다.<br />
              같은 평형·가격대 단지들과 비교해서 답을 찾습니다.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section aria-label="자주 묻는 질문">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--ds-ink-faint)' }}
          >
            자주 묻는 질문
          </h2>
          <dl className="space-y-2">
            {FAQ_ITEMS.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-xl overflow-hidden"
                style={{
                  background: 'var(--ds-cream-card)',
                  border: '1px solid var(--ds-cream-border)',
                }}
              >
                <summary
                  className="flex items-center justify-between cursor-pointer px-5 py-3.5 font-medium list-none"
                  style={{ color: 'var(--ds-ink)' }}
                >
                  <dt className="text-sm">{question}</dt>
                  <span
                    className="ml-3 shrink-0 group-open:rotate-180 transition-transform text-xs"
                    style={{ color: 'var(--ds-ink-faint)' }}
                  >
                    ▾
                  </span>
                </summary>
                <dd
                  className="px-5 pb-4 text-sm leading-relaxed"
                  style={{ color: 'var(--ds-ink-muted)' }}
                >
                  {answer}
                </dd>
              </details>
            ))}
          </dl>
        </section>
      </main>
    </ServiceLayout>
  );
}
