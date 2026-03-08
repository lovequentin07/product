import type { Metadata } from 'next'
import { getDropItems, getPopularItems } from '@/lib/db/market-mock'
import { Category } from '@/types/market'
import MarketHero from '@/components/market/MarketHero'
import PriceChangeList from '@/components/market/PriceChangeList'
import PopularSection from '@/components/market/PopularSection'
import MarketFAQ from '@/components/market/MarketFAQ'

export const metadata: Metadata = {
  title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
  description:
    '오늘 저렴해진 채소·과일·수산·축산물을 한눈에 확인하세요. 도매가·소매가 비교와 전일·전주 대비 가격 변동 제공.',
  alternates: { canonical: '/market' },
  openGraph: {
    title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
    description: '장보기 전 도매가·소매가를 먼저 확인하세요.',
    url: '/market',
  },
}

const VALID_CATEGORIES = new Set<string>(['vegetable', 'fruit', 'seafood', 'meat'])

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function MarketPage({ searchParams }: PageProps) {
  const { category } = await searchParams
  const activeCategory: Category | null =
    category && VALID_CATEGORIES.has(category) ? (category as Category) : null

  const allDropItems = getDropItems()
  const popularItems = getPopularItems()

  const dropItems = activeCategory
    ? allDropItems.filter((i) => i.category === activeCategory)
    : allDropItems

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '농수축산물 시세',
    description: '오늘 도매가·소매가를 비교하고 싸게 장보세요.',
    url: 'https://datazip.net/market',
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero — pb-3으로 drop 섹션과 시각적으로 연결 */}
      <MarketHero />

      <div className="max-w-2xl mx-auto">
        {/* 오늘 저렴해진 품목 (CategoryQuickAccess 내장) */}
        <PriceChangeList items={dropItems} title="오늘 저렴한 품목" />

        {/* 인기 품목 */}
        <PopularSection items={popularItems} />

        {/* FAQ */}
        <MarketFAQ />

        <div className="bg-white px-4 py-4 text-xs text-gray-400 text-center space-y-0.5">
          <p>가격 정보 출처: 한국농수산식품유통공사(aT) KAMIS · 공공데이터포털</p>
          <p>현재 표시 가격은 참고용 샘플 데이터입니다</p>
        </div>
      </div>
    </div>
  )
}
