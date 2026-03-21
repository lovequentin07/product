import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { getAllItems, getItemBySlug, getItemBySlugForRegion } from '@/lib/market-data'
import { detectRegion } from '@/lib/region'
import { Category, getDefaultKind } from '@/types/market'
import PriceTrendChart from '@/components/market/PriceTrendChart'
import GradeSelector from '@/components/market/GradeSelector'
import MarketFAQ from '@/components/market/MarketFAQ'

interface Props {
  params: Promise<{ item: string }>
}

const CATEGORY_LABELS: Record<Category, string> = {
  vegetable: '채소',
  fruit: '과일',
  seafood: '수산',
  grain: '곡물',
  food: '식품',
  special: '특용',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item: id } = await params
  const item = getItemBySlug(id)  // metadata는 전국 평균 기준 (정적 생성)
  if (!item) return {}

  const todayPrice = getDefaultKind(item).retailPrice
  const rate = item.trendMeta.vsYearAvgRate
  const changeStr = rate < 0
    ? `▼ ${Math.abs(rate).toFixed(1)}% 저렴`
    : `▲ ${Math.abs(rate).toFixed(1)}% 비쌈`
  const title = `${item.name} 오늘 ${todayPrice.toLocaleString()}원/${item.unit} — ${changeStr}`
  const description = `${item.name} 오늘 소매가 ${todayPrice.toLocaleString()}원/${item.unit}. 1년 평균 대비 ${Math.abs(rate).toFixed(1)}% ${rate < 0 ? '저렴' : '비쌈'}. 1년 가격 추이를 확인하세요.`

  return {
    title,
    description,
    alternates: { canonical: `/market/${id}` },
    openGraph: { title, description, url: `/market/${id}` },
  }
}

export default async function ItemPage({ params }: Props) {
  const { item: id } = await params
  const headersList = await headers()
  const sgg_cd = detectRegion(headersList)
  const item = getItemBySlugForRegion(id, sgg_cd)
  if (!item) notFound()

  const priceData = getDefaultKind(item)
  const todayPrice = priceData.retailPrice
  const hasGradeToggle = !!item.gradeGroup

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: `${item.name} 오늘 소매가 ${todayPrice.toLocaleString()}원/${item.unit}`,
    offers: {
      '@type': 'Offer',
      price: todayPrice,
      priceCurrency: 'KRW',
    },
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 헤더 */}
      <div className="bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="h-14 px-4 flex items-center justify-between">
            <Link
              href="/market"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 min-h-[44px]"
            >
              ← 시세 홈
            </Link>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
          <div className="px-4 pb-4">
            <p className="text-3xl font-bold text-gray-800">{item.name}</p>
            {/* gradeGroup 없는 경우에만 헤더에 가격 표시 (있으면 GradeSelector에서 표시) */}
            {!hasGradeToggle && (
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-bold text-gray-900 leading-none" style={{ fontSize: '28px' }}>
                  {todayPrice.toLocaleString()}원
                </span>
                <span className="text-base text-gray-400">/{item.unit}</span>
                {item.seCd && (
                  <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded self-center">
                    {item.seCd === '02' ? '도매가' : '소매가'}
                  </span>
                )}
                {item.cheapness_label && (
                  <span className="ml-auto text-xs font-semibold text-blue-600">
                    {item.cheapness_label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 가격 차트 + 등급 토글 */}
      <div className="max-w-2xl mx-auto">
        {hasGradeToggle ? (
          <GradeSelector
            gradeGroup={item.gradeGroup!}
            defaultPrice={todayPrice}
            unit={item.unit}
            seCd={item.seCd}
            featuredGrdCd={item.featuredGrdCd}
            featuredVrtyCd={item.featuredVrtyCd}
          />
        ) : (
          <div className="bg-white border-t border-gray-100">
            <PriceTrendChart monthly={item.monthly} unit={item.unit} currentPrice={todayPrice} trendMeta={item.trendMeta} cheapnessExplanation={item.cheapness_explanation} />
          </div>
        )}
      </div>

      {/* 보관 & 선택 가이드 — tips가 있을 때만 표시 */}
      {item.tips.length > 0 && (
        <div className="bg-white border-t border-gray-100 py-6">
          <div className="max-w-2xl mx-auto px-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {item.name} 보관 &amp; 선택 가이드
            </h3>
            <ul className="space-y-1.5">
              {item.tips.map((tip) => (
                <li key={tip} className="text-sm text-gray-600 leading-relaxed">
                  · {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-2xl mx-auto">
          <MarketFAQ />
          <div className="px-4 pb-2 text-xs text-gray-400 text-center">
            가격 정보 출처: 한국농수산식품유통공사(aT) · 공공데이터포털
          </div>
        </div>
      </div>
    </div>
  )
}
