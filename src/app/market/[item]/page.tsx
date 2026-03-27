import { notFound } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { getItemBySlugForRegion } from '@market/lib/market-data'
import regionStatsRaw from '@market/data/market-stats-by-region.json' // metadata용 정적 import
import { detectRegion } from '@market/lib/region'
import { Category, getDefaultKind } from '@market/types/market'
import PriceTrendChart from '@market/components/PriceTrendChart'
import BuySignalBanner from '@market/components/BuySignalBanner'
import GradeSelector from '@market/components/GradeSelector'

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
  // metadata는 JSON 정적 import 기반 (전국 평균 기준, 생성 속도 중요)
  const regionStats = regionStatsRaw as any[]
  const record = regionStats.find((r) => r.item_cd === id)
  if (!record) return {}
  const combo = record.combos.find((c: any) => c.is_default) ?? record.combos[0]
  if (!combo) return {}

  const todayPrice = combo.latest_price
  const unit = record.unit_sz === '1' ? record.unit : `${record.unit_sz}${record.unit}`
  const title = `${record.item_nm} 오늘 ${todayPrice.toLocaleString()}원/${unit}`
  const description = `${record.item_nm} 오늘 소매가 ${todayPrice.toLocaleString()}원/${unit}. 공공데이터 기반 가격 정보 및 1년 추이를 확인하세요.`

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
  const item = await getItemBySlugForRegion(id, sgg_cd)
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
          <>
            <BuySignalBanner
              cheapness_label={item.cheapness_label ?? ''}
              cheapnessExplanation={item.cheapness_explanation ?? ''}
            />
            <div className="bg-white border-t border-gray-100">
              <PriceTrendChart monthly={item.monthly} unit={item.unit} currentPrice={todayPrice} trendMeta={item.trendMeta} />
            </div>
          </>
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
    </div>
  )
}
