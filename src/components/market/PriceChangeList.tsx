import { Suspense } from 'react'
import Link from 'next/link'
import { ItemDetail, getDefaultKind } from '@/types/market'
import Sparkline from './Sparkline'
import CategoryQuickAccess from './CategoryQuickAccess'

interface Props {
  items: ItemDetail[]
  title: string
}

export default function PriceChangeList({ items, title }: Props) {
  if (items.length === 0) return null

  return (
    <section
      id="price-drop-section"
      className="bg-white px-4 pt-5 pb-4 border-t-2 border-gray-100"
    >
      {/* 섹션 헤더 */}
      <div className="border-l-4 border-blue-600 pl-3 mb-1">
        <h2
          className="flex items-center gap-1.5 leading-snug text-gray-900"
          style={{ fontSize: '20px', fontWeight: 700 }}
        >
          <span className="text-blue-600">▼</span>
          {title}
        </h2>
        <p className="mt-0.5" style={{ fontSize: '13px', color: '#9ca3af' }}>
          1년 중 가장 저렴한 시기
        </p>
      </div>

      {/* 카테고리 필터 */}
      <Suspense fallback={null}>
        <CategoryQuickAccess />
      </Suspense>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {items.map((item) => {
          const primary = getDefaultKind(item)
          const { yearMin, yearMax } = item.trendMeta
          const rangePos = yearMax > yearMin
            ? Math.round(((primary.retailPrice - yearMin) / (yearMax - yearMin)) * 100)
            : 0

          return (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="bg-white border border-gray-100 rounded-xl p-3 active:scale-[0.97] transition-transform"
            >
              {/* 품목명 + 배지 + 가격 한 줄 */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">{item.name}</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    ▼ {Math.abs(item.trendMeta.vsYearAvgRate).toFixed(1)}%
                  </span>
                  <p className="text-[11px] font-semibold text-gray-600">
                    {primary.retailPrice.toLocaleString()}원
                    <span className="text-xs font-normal text-gray-400 ml-0.5">/{item.unit}</span>
                  </p>
                </div>
              </div>

              {/* 스파크라인 — 1년 데이터, 하단 고정 */}
              <span className="block text-[10px] text-gray-400 leading-none mb-0.5">1년 추이</span>
              <Sparkline data={item.trend.map((p) => p.retail)} height={28} isDown={true} showArea />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
