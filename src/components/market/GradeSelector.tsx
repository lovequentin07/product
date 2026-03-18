'use client'

import { useState, useMemo } from 'react'
import { GradeGroup, GradeStats, TrendMeta } from '@/types/market'
import PriceTrendChart from './PriceTrendChart'

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

  // 현재 가격: 초기 조합(featured 또는 is_default)일 때 defaultPrice, 변경 시 최근 monthly.avg
  const isDefault =
    selectedGrdIdx === initialGradeIdx &&
    selectedVrtyIdx === initialVrtyIdx

  const filteredMonthly = useMemo(
    () => (selectedVariety?.monthly ?? []).filter((m) => m.ym !== CURRENT_YM),
    [selectedVariety],
  )

  const currentPrice = useMemo(() => {
    if (isDefault) return defaultPrice
    if (filteredMonthly.length === 0) return defaultPrice
    return filteredMonthly[filteredMonthly.length - 1].avg
  }, [isDefault, defaultPrice, filteredMonthly])

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

  const vsRate = trendMeta.vsYearAvgRate

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

      {/* 가격 차트 */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <PriceTrendChart monthly={filteredMonthly} unit={unit} trendMeta={trendMeta} currentPrice={currentPrice} yoyPrice={yoyPrice} />
        </div>
      </div>
    </div>
  )
}
