import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getCheapItemsByRegion } from '@market/lib/market-data'
import { detectRegion } from '@market/lib/region'
import MarketHero from '@market/components/MarketHero'
import PriceChangeList from '@market/components/PriceChangeList'
import MarketFAQ from '@market/components/MarketFAQ'
import ServiceLayout from '@shared/components/ui/ServiceLayout'

export const metadata: Metadata = {
  title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
  description:
    '오늘 저렴해진 채소·과일·수산·곡물·식품을 한눈에 확인하세요. 공공데이터 기반 소매가 비교와 1년 평균 대비 가격 변동 제공.',
  keywords: ['오늘 채소 가격', '오늘 과일 가격', '농수산물 시세', '장바구니 물가', '소매가 비교', '공공데이터 농산물'],
  alternates: { canonical: '/market' },
  openGraph: {
    title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
    description: '장보기 전 오늘 소매가를 먼저 확인하세요.',
    url: '/market',
  },
}

export default async function MarketPage() {
  const headersList = await headers()
  const sgg_cd = detectRegion(headersList)
  const cheapItems = await getCheapItemsByRegion(sgg_cd, 12)

  // BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: 'https://datazip.net',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '농수축산물 시세',
        item: 'https://datazip.net/market',
      },
    ],
  }

  // CollectionPage + ItemList (상위 6개 저렴 품목)
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
    description: '오늘 저렴해진 채소·과일·수산·곡물·식품을 한눈에 확인하세요.',
    url: 'https://datazip.net/market',
    mainEntity: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: cheapItems.slice(0, 6).map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://datazip.net/market/${item.id}`,
        name: item.name,
        description: `${item.name} - ${item.kinds[0]?.retailPrice.toLocaleString()}원/${item.unit}`,
      })),
    },
  }

  // FAQPage
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '가격 데이터는 얼마나 자주 업데이트되나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '평일 매일 오전 10시(KST)에 공공데이터포털 최신 데이터를 자동으로 수집하여 업데이트합니다.',
        },
      },
      {
        '@type': 'Question',
        name: '하위 N%는 무엇을 의미하나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '과거 1년간의 가격 이력 중 현재 가격이 상대적으로 어느 정도 수준인지를 나타냅니다. 하위 10%면 역대 저가, 상위 10%면 고가입니다.',
        },
      },
      {
        '@type': 'Question',
        name: '도매가와 소매가의 차이는?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '소매가는 마트나 시장에서 일반 소비자가 구입할 때의 가격입니다. 도매가는 도매상이 대량 구입할 때의 가격으로, 일반 소비자에게는 소매가가 적용됩니다.',
        },
      },
      {
        '@type': 'Question',
        name: '등급(상/중/하)은 어떻게 정해지나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '농산물은 크기, 외형, 신선도 등을 기준으로 상(최고급), 중(보통), 하(저가) 등급으로 분류됩니다. 등급마다 가격이 다르므로 필요에 따라 선택할 수 있습니다.',
        },
      },
    ],
  }

  return (
    <ServiceLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <MarketHero />

      <div className="max-w-2xl mx-auto">
        {/* 지역 기반 저렴 품목 (percentile 순위 top 6) */}
        <PriceChangeList items={cheapItems} title="지금 저렴한 품목" />

        {/* FAQ */}
        <MarketFAQ />

        <div className="bg-white px-4 py-4 text-xs text-gray-400 text-center space-y-0.5">
          <p>가격 정보 출처: 한국농수산식품유통공사(aT) · 공공데이터포털</p>
          <p>현재 표시 가격은 최근 수집된 공공데이터 기준입니다</p>
        </div>
      </div>
    </ServiceLayout>
  )
}
