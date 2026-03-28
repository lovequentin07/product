'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ItemDetail, getDefaultKind, Category } from '@market/types/market'
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
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const [limit, setLimit] = useState(6)

  // 카테고리 변경 시 limit 리셋
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLimit(6)
  }, [category])

  const allFiltered = (!category || category === 'all')
    ? items
    : items.filter(item => item.category === category as Category)

  const filtered = allFiltered.slice(0, limit)
  const hasMore = allFiltered.length > limit

  return (
    <section
      id="price-drop-section"
      className="bg-white px-4 pt-4 pb-4 border-t border-gray-100"
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
      </div>

      {/* 카테고리 필터 */}
      <CategoryQuickAccess />

      {/* 빈 결과 */}
      {allFiltered.length === 0 && (
        <p className="mt-6 mb-2 text-center text-sm text-gray-400">해당 카테고리에 저렴한 품목이 없습니다</p>
      )}

      {/* 카드 그리드 */}
      {allFiltered.length > 0 && (
      <div className="grid grid-cols-2 gap-2 mt-3">
        {filtered.map((item) => {
          const primary = getDefaultKind(item)

          return (
            <Link
              key={item.id}
              href={`/market/${item.id}${item.featuredGrdCd ? `?grd=${item.featuredGrdCd}${item.featuredVrtyCd ? `&vrty=${item.featuredVrtyCd}` : ''}` : ''}`}
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
      )}

      {/* 더보기/접기 버튼 */}
      {allFiltered.length > 0 && (
      <div className="flex gap-2 mt-3">
        {/* 더보기 버튼 */}
        {hasMore && (
          <button
            onClick={() => setLimit((prev) => prev + 6)}
            className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            더보기 ({allFiltered.length - limit}개 남음)
          </button>
        )}
        {/* 접기 버튼 */}
        {limit > 6 && (
          <button
            onClick={() => setLimit(6)}
            className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            접기
          </button>
        )}
      </div>
      )}
    </section>
  )
}
