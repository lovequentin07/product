'use client'

import { useState, useMemo } from 'react'
import { GradeGroup, GradeStats, PricePoint, TrendMeta } from '@/types/market'
import PriceTrendChart2 from './PriceTrendChart2'

interface Props {
  gradeGroup: GradeGroup
  defaultPrice: number  // daily latest_price (기본 등급+신선도)
  unit: string
}

// monthly[] → PricePoint[] (월당 3포인트: 1일=low, 14일=avg, 28일=high)
function monthlyToTrend(monthly: { ym: string; high: number; low: number; avg: number }[]): PricePoint[] {
  const points: PricePoint[] = []
  for (const m of monthly) {
    const yyyy = m.ym.slice(0, 4)
    const mm = m.ym.slice(4, 6)
    points.push({ date: `${yyyy}-${mm}-01`, wholesale: 0, retail: m.low })
    points.push({ date: `${yyyy}-${mm}-14`, wholesale: 0, retail: m.avg })
    points.push({ date: `${yyyy}-${mm}-28`, wholesale: 0, retail: m.high })
  }
  return points
}

// monthly[] → TrendMeta 생성
function buildTrendMeta(
  monthly: { ym: string; high: number; low: number; avg: number }[],
  currentPrice: number,
): TrendMeta {
  if (monthly.length === 0) {
    return { yearMin: 0, yearMax: 0, yearAvg: 0, yearMinDate: '', yearMaxDate: '', vsYearAvgRate: 0 }
  }
  const highs = monthly.map((m) => m.high)
  const lows = monthly.map((m) => m.low)
  const avgs = monthly.map((m) => m.avg)
  const yearMax = Math.max(...highs)
  const yearMin = Math.min(...lows)
  const yearAvg = Math.round(avgs.reduce((s, v) => s + v, 0) / avgs.length)
  const vsYearAvgRate = yearAvg > 0
    ? Math.round((currentPrice - yearAvg) / yearAvg * 1000) / 10
    : 0
  return { yearMin, yearMax, yearAvg, yearMinDate: '', yearMaxDate: '', vsYearAvgRate }
}

export default function GradeSelector({ gradeGroup, defaultPrice, unit }: Props) {
  const defaultGradeIdx = gradeGroup.grades.findIndex((g) => g.is_default)
  const [selectedGrdIdx, setSelectedGrdIdx] = useState(defaultGradeIdx >= 0 ? defaultGradeIdx : 0)

  const selectedGrade: GradeStats = gradeGroup.grades[selectedGrdIdx] ?? gradeGroup.grades[0]

  const defaultVrtyIdx = selectedGrade.varieties.findIndex((v) => v.is_default)
  const [selectedVrtyIdx, setSelectedVrtyIdx] = useState(defaultVrtyIdx >= 0 ? defaultVrtyIdx : 0)

  // 등급 변경 시 variety도 is_default로 리셋
  function handleGrdChange(idx: number) {
    setSelectedGrdIdx(idx)
    const grade = gradeGroup.grades[idx]
    const defaultIdx = grade?.varieties.findIndex((v) => v.is_default) ?? 0
    setSelectedVrtyIdx(defaultIdx >= 0 ? defaultIdx : 0)
  }

  const selectedVariety = selectedGrade.varieties[selectedVrtyIdx] ?? selectedGrade.varieties[0]

  // 선택된 variety의 monthly → trend 변환
  const trend = useMemo(() => monthlyToTrend(selectedVariety?.monthly ?? []), [selectedVariety])

  // 현재 가격: 기본 조합일 때 defaultPrice, 변경 시 최근 monthly.avg
  const isDefault =
    selectedGrdIdx === (defaultGradeIdx >= 0 ? defaultGradeIdx : 0) &&
    selectedVrtyIdx === (selectedGrade.varieties.findIndex((v) => v.is_default) >= 0
      ? selectedGrade.varieties.findIndex((v) => v.is_default)
      : 0)

  const currentPrice = useMemo(() => {
    if (isDefault) return defaultPrice
    const monthly = selectedVariety?.monthly ?? []
    if (monthly.length === 0) return defaultPrice
    return monthly[monthly.length - 1].avg
  }, [isDefault, defaultPrice, selectedVariety])

  const trendMeta = useMemo(
    () => buildTrendMeta(selectedVariety?.monthly ?? [], currentPrice),
    [selectedVariety, currentPrice],
  )

  const showGradePills = gradeGroup.grades.length >= 2
  const showVarietyPills = selectedGrade.varieties.length >= 2

  const vsRate = trendMeta.vsYearAvgRate

  return (
    <div>
      {/* 오늘 소매가 */}
      <div className="px-4 py-4 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1">오늘 소매가</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-gray-900 leading-none" style={{ fontSize: '28px' }}>
            {currentPrice.toLocaleString()}원
          </span>
          <span className="text-base text-gray-400">/{unit}</span>
          <span
            className={`ml-auto font-bold ${vsRate < 0 ? 'text-blue-500' : 'text-red-500'}`}
            style={{ fontSize: '20px' }}
          >
            {vsRate < 0 ? '▼' : '▲'} {Math.abs(vsRate).toFixed(1)}%
          </span>
        </div>

        {/* 등급 pill */}
        {showGradePills && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {gradeGroup.grades.map((grade, idx) => (
              <button
                key={grade.grd_cd}
                onClick={() => handleGrdChange(idx)}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  idx === selectedGrdIdx
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {grade.grd_label}
              </button>
            ))}
          </div>
        )}

        {/* 신선도 pill */}
        {showVarietyPills && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {selectedGrade.varieties.map((variety, idx) => (
              <button
                key={variety.vrty_cd}
                onClick={() => setSelectedVrtyIdx(idx)}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  idx === selectedVrtyIdx
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-400 hover:bg-blue-100'
                }`}
              >
                {variety.vrty_label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1년 가격 차트 */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <PriceTrendChart2 trend={trend} unit={unit} trendMeta={trendMeta} />
        </div>
      </div>
    </div>
  )
}
