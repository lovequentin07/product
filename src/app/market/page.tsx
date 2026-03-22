import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getCheapItemsByRegion } from '@market/lib/market-data'
import { detectRegion } from '@market/lib/region'
import MarketHero from '@market/components/MarketHero'
import PriceChangeList from '@market/components/PriceChangeList'
import MarketFAQ from '@market/components/MarketFAQ'

export const metadata: Metadata = {
  title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
  description:
    '오늘 저렴해진 채소·과일·수산·곡물·식품을 한눈에 확인하세요. 공공데이터 기반 소매가 비교와 1년 평균 대비 가격 변동 제공.',
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
  const cheapItems = getCheapItemsByRegion(sgg_cd, 60)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '농수축산물 시세',
    description: '오늘 소매가를 비교하고 싸게 장보세요.',
    url: 'https://datazip.net/market',
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
    </div>
  )
}
