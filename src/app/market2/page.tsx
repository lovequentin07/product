import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getDropItems } from '@/lib/db/market-mock'
import { getDefaultKind } from '@/types/market'
import MarketSearchInput from '@/components/market/MarketSearchInput'
import Sparkline from '@/components/market/Sparkline'
import MarketFAQ from '@/components/market/MarketFAQ'

export const metadata: Metadata = {
  title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
  description:
    '오늘 저렴해진 채소·과일·수산·축산물을 한눈에 확인하세요. 도매가·소매가 비교와 전일·전주 대비 가격 변동 제공.',
  alternates: { canonical: '/market2' },
  openGraph: {
    title: '오늘의 장바구니 — 지금 뭐가 싼지 바로 확인',
    description: '장보기 전 도매가·소매가를 먼저 확인하세요.',
    url: '/market2',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '농수축산물 시세',
  description: '오늘 도매가·소매가를 비교하고 싸게 장보세요.',
  url: 'https://datazip.net/market2',
}

export default async function Market2Page() {
  const dropItems = getDropItems()

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 컴팩트 Hero — 인라인 (MarketHero 미사용) */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-3">
          <h1
            className="text-gray-900 font-bold leading-tight mb-4"
            style={{ fontSize: '22px' }}
          >
            오늘 장바구니 시세, 3초 만에
          </h1>
          <Suspense fallback={null}>
            <MarketSearchInput />
          </Suspense>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Drop 섹션 — "평균比 -X%" 배지 형식 */}
        {dropItems.length > 0 && (
          <section
            id="price-drop-section"
            className="bg-white px-4 pt-5 pb-4 border-t-2 border-gray-100"
          >
            <div className="border-l-4 border-blue-600 pl-3 mb-3">
              <h2
                className="flex items-center gap-1.5 leading-snug text-gray-900"
                style={{ fontSize: '20px', fontWeight: 700 }}
              >
                <span className="text-blue-600">▼</span>
                오늘 저렴한 품목
              </h2>
              <p className="mt-0.5" style={{ fontSize: '13px', color: '#9ca3af' }}>
                1년 평균 대비 저렴한 품목
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {dropItems.map((item) => {
                const primary = getDefaultKind(item)
                const { vsYearAvgRate } = item.trendMeta
                const avgRatioLabel = `평균比 ${vsYearAvgRate < 0 ? '-' : '+'}${Math.abs(vsYearAvgRate).toFixed(1)}%`

                return (
                  <Link
                    key={item.id}
                    href={`/market2/${item.id}`}
                    className="bg-white border border-gray-100 rounded-xl p-3 active:scale-[0.97] transition-transform"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900">{item.name}</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {avgRatioLabel}
                        </span>
                        <p className="text-[11px] font-semibold text-gray-600">
                          {primary.retailPrice.toLocaleString()}원
                          <span className="text-xs font-normal text-gray-400 ml-0.5">/{item.unit}</span>
                        </p>
                      </div>
                    </div>

                    <span className="block text-[10px] text-gray-400 leading-none mb-0.5">1년 추이</span>
                    <Sparkline data={item.trend.map((p) => p.retail)} height={28} isDown={true} showArea />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

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
