'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Category, ItemDetail } from '@/types/market'

const CATEGORY_LABELS: Record<Category | 'all', string> = {
  all: '전체',
  vegetable: '채소',
  fruit: '과일',
  seafood: '수산',
  meat: '축산',
}

const CHIP_STYLES: Record<Category, string> = {
  vegetable: 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  fruit: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
  seafood: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',
  meat: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function ItemsSection({ items }: { items: ItemDetail[] }) {
  const [active, setActive] = useState<Category | 'all'>('all')

  const filtered = active === 'all' ? items : items.filter((i) => i.category === active)

  return (
    <section className="bg-white dark:bg-gray-950">
      {/* 카테고리 필터 */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
        {(['all', 'vegetable', 'fruit', 'seafood', 'meat'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`shrink-0 h-8 px-4 rounded-full text-sm font-medium transition-colors ${
              active === cat
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          자주 찾는 품목
        </p>
        <Link href="/market" className="text-xs text-teal-600 dark:text-teal-400">
          전체보기
        </Link>
      </div>

      {/* 품목 그리드 */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {filtered.map((item) => {
          const primary = item.kinds[0]
          const isDown = primary.dayChange.rate < 0
          return (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex flex-col gap-1.5 active:scale-95 transition-transform shadow-sm"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {item.name}
              </span>
              <span className={`text-xs font-medium ${isDown ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {isDown ? '▼' : '▲'} {Math.abs(primary.dayChange.rate).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                {primary.retailPrice.toLocaleString()}원
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
