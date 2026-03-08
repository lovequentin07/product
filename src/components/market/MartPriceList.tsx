import { MartPrice, Mart } from '@/types/market'

const MART_LABELS: Record<Mart, string> = {
  coupang: '쿠팡',
  emart: '이마트',
  homeplus: '홈플러스',
  lotte: '롯데마트',
}

const MART_CHIP: Record<Mart, string> = {
  coupang: 'bg-orange-500 text-white',
  emart: 'bg-yellow-400 text-yellow-900',
  homeplus: 'bg-blue-600 text-white',
  lotte: 'bg-red-500 text-white',
}

interface Props {
  martPrices: MartPrice[]
  unit: string
}

export default function MartPriceList({ martPrices, unit }: Props) {
  const valid = martPrices.filter((p) => p.price !== null)
  if (valid.length === 0) return null

  const minPrice = Math.min(...valid.map((p) => p.price!))
  const maxPrice = Math.max(...valid.map((p) => p.price!))
  const diff = maxPrice - minPrice

  const lowestMart = valid.find((p) => p.price === minPrice)!
  const highestMart = valid.find((p) => p.price === maxPrice)!

  const sorted = [...martPrices].sort((a, b) => {
    if (a.price === null) return 1
    if (b.price === null) return -1
    return a.price - b.price
  })

  return (
    <section className="mx-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        마트별 소매가 비교
        <span className="text-xs font-normal text-gray-400 ml-1.5">({unit} 기준)</span>
      </h3>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {sorted.map((mp, idx) => {
          const isLowest = mp.price !== null && mp.price === minPrice
          const barPct = mp.price ? (minPrice / mp.price) * 100 : 0

          return (
            <div
              key={mp.mart}
              className={`px-4 py-3 ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''} ${
                isLowest
                  ? 'bg-emerald-50 dark:bg-emerald-950/20'
                  : 'bg-white dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${MART_CHIP[mp.mart]}`}>
                    {MART_LABELS[mp.mart]}
                  </span>
                  {isLowest && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      최저가
                    </span>
                  )}
                </div>
                <span
                  className={`text-base font-bold ${
                    isLowest
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {mp.price !== null ? `${mp.price.toLocaleString()}원` : '정보 없음'}
                </span>
              </div>

              {mp.price !== null && (
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isLowest ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {diff > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2.5 px-1 leading-relaxed">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {MART_LABELS[lowestMart.mart]}
          </span>
          {' '}이{' '}
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {MART_LABELS[highestMart.mart]}
          </span>
          보다{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {diff.toLocaleString()}원 ({Math.round((diff / maxPrice) * 100)}%) 저렴합니다
          </span>
        </p>
      )}
    </section>
  )
}
