'use client'

import { useState, useMemo } from 'react'
import { GradeGroup, GradeStats, TrendMeta } from '@market/types/market'
import PriceTrendChart from './PriceTrendChart'
import BuySignalBanner from './BuySignalBanner'

const _now = new Date()
const CURRENT_YM = `${_now.getFullYear()}${String(_now.getMonth() + 1).padStart(2, '0')}`

interface Props {
  gradeGroup: GradeGroup
  defaultPrice: number  // daily latest_price (기본 등급+신선도)
  unit: string
  seCd?: '01' | '02'       // 도매/소매 구분 (레이블 표시용)
  featuredGrdCd?: string   // 홈 카드와 일치시킬 등급 코드 (없으면 is_default 폴백)
  featuredVrtyCd?: string  // 홈 카드와 일치시킬 신선도 코드 (없으면 is_default 폴백)
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

// percentile → 가격 상태 레이블
function getCheapnessLabel(percentile: number | undefined): string {
  if (!percentile && percentile !== 0) return ''
  if (percentile < 0.1) return '역대최저가 근접'
  if (percentile < 0.25) return '최저가 구간'
  if (percentile < 0.5) return '저가 상태'
  if (percentile < 0.75) return '보통'
  if (percentile < 0.9) return '높은 가격'
  return '비쌈'
}

// percentile + trendMeta → 가격 상태 설명
function getCheapnessExplanation(percentile: number | undefined, trendMeta: TrendMeta): string {
  if (!percentile && percentile !== 0) return ''

  const yearMin = trendMeta.yearMin
  const yearMax = trendMeta.yearMax
  const currentPrice = 0 // 이 함수에서는 직접 사용하지 않음

  // 역대 극값 체크 (하지만 현재가를 모르므로 percentile만 사용)
  // percentile 기반으로만 판단

  const percentilePct = Math.round(percentile * 100)

  if (percentile < 0.1) {
    return `과거 하위 ${percentilePct}% 수준으로, 역대최저가에 근접한 상태입니다.`
  }

  if (percentile < 0.25) {
    return `과거 하위 ${percentilePct}% 수준으로, 최저가 구간에 속합니다.`
  }

  if (percentile < 0.5) {
    return `과거 하위 ${percentilePct}% 수준으로, 저가 상태입니다.`
  }

  if (percentile < 0.75) {
    return `과거 하위 ${percentilePct}% 수준으로, 평균적인 가격입니다.`
  }

  if (percentile < 0.9) {
    const topPct = Math.round((1 - percentile) * 100)
    return `과거 상위 ${topPct}% 수준으로, 높은 가격 상태입니다.`
  }

  const topPct = Math.round((1 - percentile) * 100)
  return `과거 상위 ${topPct}% 수준으로, 매우 비싼 상태입니다.`
}

export default function GradeSelector({ gradeGroup, defaultPrice, unit, seCd, featuredGrdCd, featuredVrtyCd }: Props) {
  // featuredGrdCd가 있으면 해당 등급으로 초기화, 없으면 is_default 폴백
  const initialGradeIdx = (() => {
    if (featuredGrdCd) {
      const idx = gradeGroup.grades.findIndex((g) => g.grd_cd === featuredGrdCd)
      if (idx >= 0) return idx
    }
    const idx = gradeGroup.grades.findIndex((g) => g.is_default)
    return idx >= 0 ? idx : 0
  })()
  const [selectedGrdIdx, setSelectedGrdIdx] = useState(initialGradeIdx)

  const selectedGrade: GradeStats = gradeGroup.grades[selectedGrdIdx] ?? gradeGroup.grades[0]

  // featuredVrtyCd가 있으면 해당 신선도로 초기화, 없으면 is_default 폴백
  const initialVrtyIdx = (() => {
    if (featuredVrtyCd) {
      const idx = selectedGrade.varieties.findIndex((v) => v.vrty_cd === featuredVrtyCd)
      if (idx >= 0) return idx
    }
    const idx = selectedGrade.varieties.findIndex((v) => v.is_default)
    return idx >= 0 ? idx : 0
  })()
  const [selectedVrtyIdx, setSelectedVrtyIdx] = useState(initialVrtyIdx)

  // 등급 변경 시 variety도 is_default로 리셋
  function handleGrdChange(idx: number) {
    setSelectedGrdIdx(idx)
    const grade = gradeGroup.grades[idx]
    const defaultIdx = grade?.varieties.findIndex((v) => v.is_default) ?? 0
    setSelectedVrtyIdx(defaultIdx >= 0 ? defaultIdx : 0)
  }

  const selectedVariety = selectedGrade.varieties[selectedVrtyIdx] ?? selectedGrade.varieties[0]

  const filteredMonthly = useMemo(
    () => (selectedVariety?.monthly ?? []).filter((m) => m.ym !== CURRENT_YM),
    [selectedVariety],
  )

  // 모든 조합에 동일한 기준 적용: selectedVariety.latest_price 사용
  const currentPrice = useMemo(() => {
    return selectedVariety?.latest_price ?? filteredMonthly[filteredMonthly.length - 1]?.avg ?? defaultPrice
  }, [selectedVariety, filteredMonthly, defaultPrice])

  const trendMeta = useMemo(
    () => buildTrendMeta(filteredMonthly, currentPrice),
    [filteredMonthly, currentPrice],
  )

  // yoyPrice: filteredMonthly에서 전년 동월 avg 직접 조회
  const yoyPrice = useMemo(() => {
    if (filteredMonthly.length === 0) return undefined
    const lastYm = filteredMonthly[filteredMonthly.length - 1].ym
    let y = parseInt(lastYm.slice(0, 4))
    let m = parseInt(lastYm.slice(4, 6)) - 12
    while (m <= 0) { m += 12; y-- }
    const yoy_ym = `${y}${String(m).padStart(2, '0')}`
    return filteredMonthly.find((p) => p.ym === yoy_ym)?.avg
  }, [filteredMonthly])

  const showGradePills = gradeGroup.grades.length >= 2
  const showVarietyPills = selectedGrade.varieties.length >= 2

  return (
    <div>
      {/* 오늘 가격 */}
      <div className="px-4 py-4 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{seCd === '02' ? '오늘 도매가' : '오늘 소매가'}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-gray-900 leading-none" style={{ fontSize: '28px' }}>
            {currentPrice.toLocaleString()}원
          </span>
          <span className="text-base text-gray-400">/{unit}</span>
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

      {/* 판단 배너 */}
      <BuySignalBanner
        cheapness_label={getCheapnessLabel(selectedVariety?.percentile)}
        cheapnessExplanation={getCheapnessExplanation(selectedVariety?.percentile, trendMeta)}
      />

      {/* 가격 차트 */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <PriceTrendChart
            monthly={filteredMonthly}
            unit={unit}
            currentPrice={currentPrice}
            trendMeta={trendMeta}
          />
        </div>
      </div>
    </div>
  )
}
