import { Suspense } from 'react'
import Link from 'next/link'
import { ItemDetail, getDefaultKind } from '@market/types/market'
import CategoryQuickAccess from './CategoryQuickAccess'

interface Props {
  items: ItemDetail[]
  title: string
}

function getGaugeColor(percentile: number): string {
  if (percentile <= 0.1) return 'bg-emerald-500'
  if (percentile <= 0.25) return 'bg-green-400'
  return 'bg-lime-400'
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

          return (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="bg-white border border-gray-100 rounded-xl p-3 active:scale-[0.97] transition-transform"
            >
              {/* 품목명 */}
              <span className="text-sm font-bold text-gray-900">{item.name}</span>
              {/* 가격 */}
              <p className="flex items-center gap-1 text-[13px] font-semibold text-gray-800 mt-1">
                <span>{primary.retailPrice.toLocaleString()}원</span>
                <span className="text-[11px] font-normal text-gray-400">/{item.unit}</span>
                {item.seCd && (
                  <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">
                    {item.seCd === '02' ? '도매가' : '소매가'}
                  </span>
                )}
              </p>
              {/* 게이지 바 + 하위 N% */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getGaugeColor(item.percentile)}`}
                    style={{ width: `${Math.round(item.percentile * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-green-600 font-medium shrink-0 whitespace-nowrap">
                  하위 {Math.round(item.percentile * 100)}%
                </span>
              </div>
              {/* 등급·신선도 pill (grade group 품목만) */}
              {(item.grd_label || item.vrty_label) && (
                <p className="mt-1 text-[11px] text-gray-400">
                  {[item.grd_label, item.vrty_label].filter(Boolean).join('·')}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
