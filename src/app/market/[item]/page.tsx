import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getItemBySlugForRegion, itemNmToCode, itemCdToNm } from '@market/lib/market-data'
import regionStatsRaw from '@market/data/market-stats-by-region.json' // metadata용 정적 import
import { detectRegion } from '@market/lib/region'
import { Category, getDefaultKind } from '@market/types/market'
import PriceTrendChart from '@market/components/PriceTrendChart'
import BuySignalBanner from '@market/components/BuySignalBanner'
import GradeSelector from '@market/components/GradeSelector'
import ServiceLayout from '@shared/components/ui/ServiceLayout'
import DataNotFound from '@shared/components/ui/DataNotFound'

interface Props {
  params: Promise<{ item: string }>
  searchParams: Promise<{ grd?: string; vrty?: string }>
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
  const { item: rawItem } = await params
  const item = decodeURIComponent(rawItem)
  let itemCd: string;
  if (/^\d+$/.test(item)) {
    // 숫자 코드: generateMetadata에서는 redirect 불가, page 함수가 처리
    itemCd = item;
  } else {
    const found = itemNmToCode(item);
    if (!found) return { title: '시세 정보를 찾을 수 없습니다' };
    itemCd = found;
  }
  // metadata는 JSON 정적 import 기반 (전국 평균 기준, 생성 속도 중요)
  type RegionStatRecord = { item_cd: string; item_nm: string; unit: string; unit_sz: string; combos: { is_default: boolean; latest_price: number }[] }
  const regionStats = regionStatsRaw as RegionStatRecord[]
  const record = regionStats.find((r) => r.item_cd === itemCd)
  if (!record) return {
    title: '시세 정보를 찾을 수 없습니다',
    description: '해당 품목의 시세 데이터를 찾을 수 없습니다. 다른 품목을 검색해보세요.',
  }
  const combo = record.combos.find((c) => c.is_default) ?? record.combos[0]
  if (!combo) return {
    title: '시세 정보를 찾을 수 없습니다',
    description: '해당 품목의 시세 데이터를 찾을 수 없습니다. 다른 품목을 검색해보세요.',
  }

  const todayPrice = combo.latest_price
  const unit = record.unit_sz === '1' ? record.unit : `${record.unit_sz}${record.unit}`
  const title = `${record.item_nm} 오늘 ${todayPrice.toLocaleString()}원/${unit}`
  const description = `${record.item_nm} 오늘 소매가 ${todayPrice.toLocaleString()}원/${unit}. 공공데이터 기반 가격 정보 및 1년 추이를 확인하세요.`
  const itemNm = record.item_nm;

  return {
    title,
    description,
    keywords: [`${itemNm} 가격`, `${itemNm} 오늘 시세`, `${itemNm} 소매가`, '농산물 가격', '오늘 시세'],
    alternates: { canonical: `/market/${encodeURIComponent(itemNm)}` },
    openGraph: { title, description, url: `/market/${encodeURIComponent(itemNm)}` },
  }
}

export default async function ItemPage({ params, searchParams }: Props) {
  const { item: rawItem } = await params
  const item = decodeURIComponent(rawItem)
  if (/^\d+$/.test(item)) {
    const nm = itemCdToNm(item);
    if (nm) redirect(`/market/${encodeURIComponent(nm)}`);
    notFound();
  }
  const itemCd = itemNmToCode(item);
  if (!itemCd) notFound();
  const { grd, vrty } = await searchParams
  const headersList = await headers()
  const sgg_cd = detectRegion(headersList)
  const itemDetail = await getItemBySlugForRegion(itemCd, sgg_cd)
  if (!itemDetail) return (
    <ServiceLayout>
      <DataNotFound
        title={`${item} 시세 정보를 찾을 수 없습니다`}
        message="해당 품목의 시세 데이터가 아직 공공데이터포털에 수집되지 않았습니다."
        source="공공데이터포털 KAMIS"
        backHref="/market"
        backLabel="장보기 시세로 돌아가기"
      />
    </ServiceLayout>
  )

  const priceData = getDefaultKind(itemDetail)
  const todayPrice = priceData.retailPrice
  const hasGradeToggle = !!itemDetail.gradeGroup

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
      {
        '@type': 'ListItem',
        position: 3,
        name: itemDetail.name,
        item: `https://datazip.net/market/${encodeURIComponent(item)}`,
      },
    ],
  }

  // Product + AggregateOffer
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemDetail.name,
    description: `${itemDetail.name} 오늘 소매가 ${todayPrice.toLocaleString()}원/${itemDetail.unit}. 공공데이터 기반 가격 정보.`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'KRW',
      lowPrice: itemDetail.trendMeta.yearMin,
      highPrice: itemDetail.trendMeta.yearMax,
      offerCount: 1,
      offers: {
        '@type': 'Offer',
        price: todayPrice,
        priceCurrency: 'KRW',
      },
    },
  }

  // FAQPage
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${itemDetail.name} 가격 정보는 어디서 가져오나요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: '한국농수산식품유통공사(aT)의 공공데이터포털 소매가 기준 데이터를 활용합니다. 평일 매일 오전 10시에 자동으로 최신 데이터가 업데이트됩니다.',
        },
      },
      {
        '@type': 'Question',
        name: `오늘 ${itemDetail.name} 가격이 싼 편인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `오늘 ${itemDetail.name} 가격은 ${todayPrice.toLocaleString()}원/${itemDetail.unit}입니다. 지난 1년 평균(${itemDetail.trendMeta.yearAvg.toLocaleString()}원)과 비교할 수 있으며, 과거 1년 최저 ${itemDetail.trendMeta.yearMin.toLocaleString()}원, 최고 ${itemDetail.trendMeta.yearMax.toLocaleString()}원 수준입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: `${itemDetail.name} 하위 N%(percentile)란 무엇인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: '과거 1년간의 가격 이력 중 현재 가격이 상대적으로 어느 정도 수준인지를 나타냅니다. 하위 10%면 역대 저가 구간, 상위 10%면 역대 고가 구간입니다.',
        },
      },
      {
        '@type': 'Question',
        name: `${itemDetail.name} 소매가란 무엇인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: '소매가는 마트나 전통시장에서 일반 소비자가 실제로 지불하는 가격입니다. 도매가보다 높으며 일반 소비자에게 적용되는 실용적인 기준 가격입니다.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
              {CATEGORY_LABELS[itemDetail.category]}
            </span>
          </div>
          <div className="px-4 pb-4">
            <p className="text-3xl font-bold text-gray-800">{itemDetail.name}</p>
            {/* gradeGroup 없는 경우에만 헤더에 가격 표시 (있으면 GradeSelector에서 표시) */}
            {!hasGradeToggle && (
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-bold text-gray-900 leading-none" style={{ fontSize: '28px' }}>
                  {todayPrice.toLocaleString()}원
                </span>
                <span className="text-base text-gray-400">/{itemDetail.unit}</span>
                {itemDetail.seCd && (
                  <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded self-center">
                    {itemDetail.seCd === '02' ? '도매가' : '소매가'}
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
            gradeGroup={itemDetail.gradeGroup!}
            defaultPrice={todayPrice}
            unit={itemDetail.unit}
            seCd={itemDetail.seCd}
            featuredGrdCd={grd ?? itemDetail.featuredGrdCd}
            featuredVrtyCd={vrty ?? itemDetail.featuredVrtyCd}
          />
        ) : (
          <>
            <BuySignalBanner
              cheapness_label={itemDetail.cheapness_label ?? ''}
              cheapnessExplanation={itemDetail.cheapness_explanation ?? ''}
            />
            <div className="bg-white border-t border-gray-100">
              <PriceTrendChart monthly={itemDetail.monthly} currentPrice={todayPrice} trendMeta={itemDetail.trendMeta} />
            </div>
          </>
        )}
      </div>

      {/* 보관 & 선택 가이드 — tips가 있을 때만 표시 */}
      {itemDetail.tips.length > 0 && (
        <div className="bg-white border-t border-gray-100 py-6">
          <div className="max-w-2xl mx-auto px-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {itemDetail.name} 보관 &amp; 선택 가이드
            </h3>
            <ul className="space-y-1.5">
              {itemDetail.tips.map((tip) => (
                <li key={tip} className="text-sm text-gray-600 leading-relaxed">
                  · {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ServiceLayout>
  )
}
