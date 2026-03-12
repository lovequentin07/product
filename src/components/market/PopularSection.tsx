import Link from 'next/link'
import { ItemDetail } from '@/types/market'

export default function PopularSection({ items }: { items: ItemDetail[] }) {
  if (items.length === 0) return null

  return (
    <section className="bg-white pt-5 pb-4 border-t border-gray-100">
      <div className="px-4 mb-3">
        <h2 className="leading-snug" style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
          지금 많이 찾는 품목
        </h2>
        <p className="mt-0.5" style={{ fontSize: '13px', color: '#9ca3af' }}>
          많이 찾는 품목, 오늘 가격은?
        </p>
      </div>
      <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-none">
        {items.map((item) => {
          const primary = item.kinds[0]
          const rate = item.trendMeta.vsYearAvgRate
          const isDown = rate < 0
          return (
            <Link
              key={item.id}
              href={`/market/${item.id}`}
              className="shrink-0 w-28 bg-white border border-gray-100 rounded-xl p-3 flex flex-col gap-1 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-1.5">
                {item.popularRank !== undefined && (
                  <span className="shrink-0 text-[11px] font-black text-gray-400">
                    {item.popularRank}
                  </span>
                )}
                <span className="text-[12px] font-semibold text-gray-900">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900 mt-0.5">
                {primary.retailPrice.toLocaleString()}원
                <span className="text-xs font-normal text-gray-400 ml-0.5">/{item.unit}</span>
              </span>
              <span className={`text-xs font-semibold ${isDown ? 'text-blue-600' : 'text-orange-500'}`}>
                {isDown ? '▼' : '▲'} {Math.abs(rate).toFixed(1)}%
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
