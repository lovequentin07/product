import Link from 'next/link'
import { ItemDetail } from '@/types/market'

export default function SeasonalSection({ items }: { items: ItemDetail[] }) {
  if (items.length === 0) return null

  const month = new Date().toLocaleDateString('ko-KR', { month: 'long' })

  return (
    <section className="bg-white dark:bg-gray-950 pt-5 pb-4 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 px-4">
        {month} 제철 품목
      </p>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-none">
        {items.map((item) => {
          const primary = item.kinds[0]
          const isDown = primary.dayChange.rate < 0
          return (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="shrink-0 w-32 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex flex-col gap-1 active:scale-95 transition-transform shadow-sm"
            >
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.name}</span>
              <span className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                {primary.retailPrice.toLocaleString()}원
                <span className="text-xs font-normal text-gray-400 ml-0.5">/{item.unit}</span>
              </span>
              <span className={`text-xs font-semibold ${isDown ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {isDown ? '▼' : '▲'} {Math.abs(primary.dayChange.rate).toFixed(1)}%
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
