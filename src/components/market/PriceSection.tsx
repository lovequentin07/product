'use client'

import { ItemDetail, getDefaultKind } from '@/types/market'
import BuyingTimingBanner from './BuyingTimingBanner'

export default function PriceSection({ item }: { item: ItemDetail }) {
  const priceData = getDefaultKind(item)

  const week = priceData.weekChange
  const isWeekDown = week.rate < 0

  // 6개월/1년 전 비교 (trend: 날짜 오름차순, 최대 365개)
  const price6mAgo = item.trend.length >= 180 ? item.trend[item.trend.length - 181]?.retail : null
  const price1yAgo = item.trend.length >= 30 ? item.trend[0]?.retail : null
  const currentPrice = priceData.retailPrice
  const change6m = price6mAgo != null ? currentPrice - price6mAgo : null
  const change1y = price1yAgo != null ? currentPrice - price1yAgo : null

  return (
    <div className="bg-white pb-6">
      <div className="max-w-2xl mx-auto">
        {/* 구매 타이밍 배너 */}
        <BuyingTimingBanner
          vsYearAvgRate={item.trendMeta.vsYearAvgRate}
          yearMin={item.trendMeta.yearMin}
          yearMax={item.trendMeta.yearMax}
          yearAvg={item.trendMeta.yearAvg}
          currentPrice={priceData.retailPrice}
        />

        {/* 가격 비교 근거 리스트 */}
        <div className="mx-4 mt-3 mb-5 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
          {/* 7일전 */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isWeekDown ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-600">7일 전보다</span>
            <span className={`ml-auto text-sm font-semibold ${isWeekDown ? 'text-green-600' : 'text-red-500'}`}>
              {Math.abs(week.amount).toLocaleString()}원 {isWeekDown ? '저렴' : '비쌈'}
            </span>
          </div>

          {/* 6개월전 */}
          {change6m != null && price6mAgo != null && price6mAgo > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${change6m < 0 ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-600">6개월 전보다</span>
              <span className={`ml-auto text-sm font-semibold ${change6m < 0 ? 'text-green-600' : 'text-red-500'}`}>
                {Math.abs(change6m).toLocaleString()}원 {change6m < 0 ? '저렴' : '비쌈'}
              </span>
            </div>
          )}

          {/* 1년전 */}
          {change1y != null && price1yAgo != null && price1yAgo > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${change1y < 0 ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-600">1년 전보다</span>
              <span className={`ml-auto text-sm font-semibold ${change1y < 0 ? 'text-green-600' : 'text-red-500'}`}>
                {Math.abs(change1y).toLocaleString()}원 {change1y < 0 ? '저렴' : '비쌈'}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 px-4">출처: aT KAMIS 공공데이터</p>
      </div>
    </div>
  )
}
