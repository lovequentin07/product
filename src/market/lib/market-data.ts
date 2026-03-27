/**
 * src/market/lib/market-data.ts
 * 농산물 시세 데이터 레이어 (D1 기반 + JSON mock fallback)
 *
 * 순수 함수들:
 * - getCheapnessInfo()
 * - buildTrendMeta()
 * - buildGradeGroup()
 * - appendLatestYmPoint()
 *
 * Async 함수들 (D1 쿼리):
 * - getCheapItemsByRegion()
 * - getItemBySlugForRegion()
 * - getAllItemsByCategory()
 */

import { Category, GradeGroup, GradeStats, ItemDetail, MonthlyPoint, TrendMeta, VarietyStats } from '@market/types/market'
import {
  getCheapItems,
  getItemStats,
  getMonthlyPrices,
  getItemStatsByRegion,
} from '@market/lib/db/market'
import type { MarketItemStats } from '@market/types/market'

const _now = new Date()
const CURRENT_YM = `${_now.getFullYear()}${String(_now.getMonth() + 1).padStart(2, '0')}`

// =====================================================================
// 순수 함수들 (재사용)
// =====================================================================

/** ctgry_cd → Category 매핑 */
function ctgryToCategory(ctgry_cd: string): Category {
  switch (ctgry_cd) {
    case '100': return 'grain'
    case '200': return 'vegetable'
    case '300': return 'special'
    case '400': return 'fruit'
    case '600': return 'seafood'
    case '800': return 'food'
    default: return 'vegetable'
  }
}

/** unit 표시 문자열 생성 */
function buildUnitDisplay(unit: string, unit_sz: string): string {
  return unit_sz === '1' ? unit : `${unit_sz}${unit}`
}

/** TrendMeta 생성 (monthly 배열 기반) */
export function buildTrendMeta(monthly: MonthlyPoint[], latestPrice: number): TrendMeta {
  if (monthly.length === 0) {
    return { yearMin: 0, yearMax: 0, yearAvg: 0, yearMinDate: '', yearMaxDate: '', vsYearAvgRate: 0 }
  }
  const validAvgs = monthly.filter((m) => m.avg != null).map((m) => m.avg!)
  const yearAvg = validAvgs.length > 0 ? Math.round(validAvgs.reduce((s, v) => s + v, 0) / validAvgs.length) : 0
  const yearMin = Math.min(...monthly.filter((m) => m.low != null).map((m) => m.low!))
  const yearMax = Math.max(...monthly.filter((m) => m.high != null).map((m) => m.high!))
  const vsYearAvgRate = yearAvg > 0
    ? Math.round(((latestPrice - yearAvg) / yearAvg) * 1000) / 10
    : 0
  return { yearMin, yearMax, yearAvg, yearMinDate: '', yearMaxDate: '', vsYearAvgRate }
}

/** latest_ym 포인트 추가 (dot만, high/low/avg 모두 없음) */
function appendLatestYmPoint(
  monthly: MonthlyPoint[],
  latestYm: string
): MonthlyPoint[] {
  const lastYm = monthly[monthly.length - 1]?.ym ?? ''
  if (latestYm <= lastYm) return monthly
  return [...monthly, { ym: latestYm, high: null, low: null, avg: null }]
}

/** 저렴함/비쌈 정보 (percentile + 역대 극값 기반) */
export function getCheapnessInfo(
  percentile: number,
  latestPrice: number,
  yearMin: number,
  yearMax: number
): { label: string; explanation: string } {
  const isAllTimeLowest = yearMin > 0 && Math.abs(latestPrice - yearMin) / yearMin <= 0.01
  const isAllTimeHighest = yearMax > 0 && Math.abs(latestPrice - yearMax) / yearMax <= 0.01

  if (isAllTimeLowest) {
    return {
      label: '역대최저가',
      explanation: '역대 가장 저렴한 가격입니다.',
    }
  }

  if (isAllTimeHighest) {
    return {
      label: '역대최고가',
      explanation: '역대 가장 비싼 가격입니다.',
    }
  }

  const percentilePct = Math.round(percentile * 100)

  if (percentile < 0.1) {
    return {
      label: '역대최저가 근접',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 역대최저가에 근접한 상태입니다.`,
    }
  }

  if (percentile < 0.25) {
    return {
      label: '최저가 구간',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 최저가 구간에 속합니다.`,
    }
  }

  if (percentile < 0.5) {
    return {
      label: '저가 상태',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 저가 상태입니다.`,
    }
  }

  if (percentile < 0.75) {
    return {
      label: '보통',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 평균적인 가격입니다.`,
    }
  }

  if (percentile < 0.9) {
    const topPct = Math.round((1 - percentile) * 100)
    return {
      label: '높은 가격',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 상위 ${topPct}% 수준으로, 높은 가격 상태입니다.`,
    }
  }

  const topPct = Math.round((1 - percentile) * 100)
  return {
    label: '비쌈',
    explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 상위 ${topPct}% 수준으로, 매우 비싼 상태입니다.`,
  }
}

/** combos → GradeGroup 변환 */
function buildGradeGroup(combos: MarketItemStats[], monthlyMap: Map<string, MonthlyPoint[]>): GradeGroup | undefined {
  if (combos.length <= 1) return undefined

  // grd_cd별로 그룹화
  const grdMap = new Map<string, MarketItemStats[]>()
  for (const c of combos) {
    if (!grdMap.has(c.grd_cd)) grdMap.set(c.grd_cd, [])
    grdMap.get(c.grd_cd)!.push(c)
  }

  const uniqueGrdCds = [...grdMap.keys()]
  const grdVariable = uniqueGrdCds.length > 1
  const uniqueVrtyLabels = [...new Set(combos.map((c) => c.vrty_label))]
  const vrtyVariable = uniqueVrtyLabels.length > 1

  if (!grdVariable && !vrtyVariable) return undefined

  const grades: GradeStats[] = []
  const defaultCombo = combos.find((c) => c.is_default) ?? combos[0]

  for (const grd_cd of [...grdMap.keys()].sort()) {
    const grdCombos = grdMap.get(grd_cd)!
    const varieties: VarietyStats[] = []

    if (vrtyVariable) {
      const defaultVrtyCd = grdCombos.find((c) => c.is_default)?.vrty_cd ?? grdCombos[0].vrty_cd

      for (const combo of grdCombos) {
        const monthlyKey = `${combo.grd_cd}_${combo.vrty_cd}`
        varieties.push({
          vrty_cd: combo.vrty_cd,
          vrty_label: combo.vrty_label || '',
          is_default: combo.vrty_cd === defaultVrtyCd,
          coverage: 1, // 단순화 (DB에서 관리할 때 원본 보유)
          monthly: monthlyMap.get(monthlyKey) ?? [],
          percentile: combo.percentile || 0,
          latest_price: combo.latest_price || 0,
        })
      }
    } else {
      const defaultC = grdCombos.find((c) => c.is_default) ?? grdCombos[0]
      const monthlyKey = `${defaultC.grd_cd}_${defaultC.vrty_cd}`
      varieties.push({
        vrty_cd: defaultC.vrty_cd,
        vrty_label: '',
        is_default: true,
        coverage: 1,
        monthly: monthlyMap.get(monthlyKey) ?? [],
        percentile: defaultC.percentile || 0,
        latest_price: defaultC.latest_price || 0,
      })
    }

    if (varieties.length === 0) continue

    grades.push({
      grd_cd,
      grd_label: grdVariable ? grdCombos[0].grd_label || '' : '',
      is_default: grd_cd === defaultCombo.grd_cd,
      varieties,
    })
  }

  const totalCombos = grades.reduce((s, g) => s + g.varieties.length, 0)
  if (totalCombos <= 1) return undefined

  return { grades }
}

// =====================================================================
// Async 함수들 (D1 쿼리)
// =====================================================================

/** StatRow → ItemDetail 변환 */
async function statsToItemDetail(stat: MarketItemStats, allStats?: MarketItemStats[]): Promise<ItemDetail | null> {
  if (!stat.latest_price) return null

  // monthly 데이터 로드
  const monthly = await getMonthlyPrices(
    stat.item_cd,
    stat.sgg_cd,
    stat.grd_cd,
    stat.vrty_cd
  )

  if (monthly.length === 0) return null

  // 현재월 필터링 및 latest_ym 포인트 추가
  const filteredMonthly = monthly.filter((m) => m.ym !== CURRENT_YM)
  const pointedMonthly = appendLatestYmPoint(
    filteredMonthly,
    stat.latest_ym?.slice(0, 6) || CURRENT_YM
  )

  const trendMeta = buildTrendMeta(pointedMonthly, stat.latest_price)
  const unitDisplay = buildUnitDisplay(stat.unit, stat.unit_sz)

  // gradeGroup: 같은 item_cd + sgg_cd의 combos 모음
  const combos = allStats || await getItemStats(stat.item_cd, stat.sgg_cd)

  // 모든 combos의 monthly 데이터 로드
  const monthlyMap = new Map<string, MonthlyPoint[]>()
  for (const combo of combos) {
    const monthlyKey = `${combo.grd_cd}_${combo.vrty_cd}`
    if (!monthlyMap.has(monthlyKey)) {
      const comboMonthly = await getMonthlyPrices(
        combo.item_cd,
        combo.sgg_cd,
        combo.grd_cd,
        combo.vrty_cd
      )
      const filteredMonthly = comboMonthly.filter((m) => m.ym !== CURRENT_YM)
      const pointedMonthly = appendLatestYmPoint(
        filteredMonthly,
        combo.latest_ym?.slice(0, 6) || CURRENT_YM
      )
      monthlyMap.set(monthlyKey, pointedMonthly)
    }
  }

  const gradeGroup = buildGradeGroup(combos, monthlyMap)

  const defaultGrade = gradeGroup?.grades.find((g) => g.is_default) ?? gradeGroup?.grades[0]
  const defaultVariety = defaultGrade?.varieties.find((v) => v.is_default) ?? defaultGrade?.varieties[0]

  return {
    id: stat.item_cd,
    name: stat.item_nm,
    category: ctgryToCategory(stat.ctgry_cd),
    unit: unitDisplay,
    kinds: [
      {
        kind: stat.grd_label || '상',
        retailPrice: stat.latest_price,
        wholesalePrice: 0,
      },
    ],
    monthly: pointedMonthly,
    trendMeta,
    martPrices: [],
    tips: [],
    gradeGroup,
    grd_label: defaultGrade?.grd_label,
    vrty_label: defaultVariety?.vrty_label,
    featuredGrdCd: defaultGrade?.grd_cd,
    featuredVrtyCd: defaultVariety?.vrty_cd,
    seCd: stat.se_cd as '01' | '02' | undefined,
    percentile: stat.percentile || 0,
    cheapness_label: getCheapnessInfo(
      stat.percentile || 0,
      stat.latest_price,
      trendMeta.yearMin,
      trendMeta.yearMax
    ).label,
    cheapness_explanation: getCheapnessInfo(
      stat.percentile || 0,
      stat.latest_price,
      trendMeta.yearMin,
      trendMeta.yearMax
    ).explanation,
  }
}

/**  지역 기반 저렴 품목 */
export async function getCheapItemsByRegion(sgg_cd: string, limit = 6): Promise<ItemDetail[]> {
  const cheapStats = await getCheapItems(sgg_cd, limit)

  const result: ItemDetail[] = []
  for (const stat of cheapStats) {
    // 같은 item_cd + sgg_cd의 combos만 필터링하여 전달 (gradeGroup 올바르게 구성)
    const itemCombos = cheapStats.filter(s => s.item_cd === stat.item_cd && s.sgg_cd === stat.sgg_cd)
    const item = await statsToItemDetail(stat, itemCombos)
    if (item) result.push(item)
  }
  return result
}

/** slug + 지역 기반 단일 품목 조회 */
export async function getItemBySlugForRegion(slug: string, sgg_cd: string): Promise<ItemDetail | undefined> {
  const allStats = await getItemStats(slug, sgg_cd)
  if (allStats.length === 0) return undefined

  const defaultStat = allStats.find((s) => s.is_default) ?? allStats[0]
  const item = await statsToItemDetail(defaultStat, allStats)

  return item || undefined
}

/** 지역×카테고리 기반 전체 품목 */
export async function getAllItemsByCategory(
  sgg_cd: string,
  ctgry_cd?: string
): Promise<ItemDetail[]> {
  const allStats = await getItemStatsByRegion(sgg_cd, ctgry_cd)

  // item_cd별 grouping (중복 제거)
  const itemMap = new Map<string, MarketItemStats[]>()
  for (const stat of allStats) {
    if (!itemMap.has(stat.item_cd)) itemMap.set(stat.item_cd, [])
    itemMap.get(stat.item_cd)!.push(stat)
  }

  const result: ItemDetail[] = []
  for (const combos of itemMap.values()) {
    const defaultCombo = combos.find((c) => c.is_default) ?? combos[0]
    const item = await statsToItemDetail(defaultCombo, combos)
    if (item) result.push(item)
  }

  // ctgry → item_cd 순 정렬
  result.sort((a, b) => a.id.localeCompare(b.id))
  return result
}
