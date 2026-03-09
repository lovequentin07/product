import { Suspense } from 'react'
import Link from 'next/link'
import { ItemDetail, getDefaultKind } from '@/types/market'
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
          const rate = Math.abs(item.trendMeta.vsYearAvgRate).toFixed(1)

          return (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="bg-white border border-gray-100 rounded-xl p-3 active:scale-[0.97] transition-transform"
            >
              {/* 품목명 + 배지 */}
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm font-bold text-gray-900">{item.name}</span>
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1">
                  ▼ {rate}%
                </span>
              </div>
              {/* 가격 */}
              <p className="text-[13px] font-semibold text-gray-800">
                {primary.retailPrice.toLocaleString()}원
                <span className="text-[11px] font-normal text-gray-400 ml-0.5">/{item.unit}</span>
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
