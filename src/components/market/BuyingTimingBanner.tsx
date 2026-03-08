interface BuyingTimingBannerProps {
  vsYearAvgRate: number
  yearMin: number
  yearMax: number
  yearAvg: number
  currentPrice: number
}

export default function BuyingTimingBanner({
  vsYearAvgRate,
  yearMin,
  yearMax,
  yearAvg,
  currentPrice,
}: BuyingTimingBannerProps) {
  const isCheap = vsYearAvgRate < 0
  const pct = Math.abs(vsYearAvgRate).toFixed(1)

  // 연간 범위 내 현재가/연평균 위치 (0~100%)
  const range = yearMax - yearMin || 1
  const currentPos = Math.min(100, Math.max(0, ((currentPrice - yearMin) / range) * 100))
  const avgPos = Math.min(100, Math.max(0, ((yearAvg - yearMin) / range) * 100))

  return (
    <div
      className={`mx-4 mt-3 px-4 py-4 rounded-xl border ${
        isCheap
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      {/* 타이틀 */}
      <p className={`text-lg font-bold mb-2 ${isCheap ? 'text-green-700' : 'text-red-600'}`}>
        {isCheap ? '지금이 사기 좋은 시점' : '지금은 비싼 시점'}
      </p>

      {/* 퍼센트 + 설명 */}
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className={`text-2xl font-black leading-none ${
            isCheap ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {isCheap ? '-' : '+'}{pct}%
        </span>
        <span className="text-sm text-gray-400">연평균 대비</span>
      </div>

      {/* 연간 범위 바 */}
      <div className="mt-3">
        <div className="relative h-3 bg-gray-200 rounded-full">
          {/* 연평균 마커 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-400 rounded"
            style={{ left: `${avgPos}%` }}
          />
          {/* 현재가 마커 */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow ${
              isCheap ? 'bg-green-600' : 'bg-red-500'
            }`}
            style={{ left: `calc(${currentPos}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>최저 {yearMin.toLocaleString()}원</span>
          <span className="text-gray-500">연평균 {yearAvg.toLocaleString()}원</span>
          <span>최고 {yearMax.toLocaleString()}원</span>
        </div>
      </div>

    </div>
  )
}
