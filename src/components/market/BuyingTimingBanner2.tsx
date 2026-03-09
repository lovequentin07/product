interface BuyingTimingBanner2Props {
  vsYearAvgRate: number
  currentPrice: number
  yearMin: number
  yearMax: number
  yearAvg: number
}

export default function BuyingTimingBanner2({
  vsYearAvgRate,
}: BuyingTimingBanner2Props) {
  const isDown = vsYearAvgRate < 0

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        isDown ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <p className={`text-sm font-bold ${isDown ? 'text-green-700' : 'text-red-600'}`}>
        {isDown ? '✓ 지금이 살 때입니다' : '⚠ 비싼 시기입니다'}
      </p>
      <p className={`text-xs mt-0.5 ${isDown ? 'text-green-600' : 'text-red-500'}`}>
        1년 평균보다 {Math.abs(vsYearAvgRate).toFixed(1)}% {isDown ? '저렴' : '비쌈'}
      </p>
    </div>
  )
}
