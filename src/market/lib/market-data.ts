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
import marketStatsRaw from '@market/data/market-stats-by-region.json'

const _nameToCode = new Map<string, string>();
const _codeToName = new Map<string, string>();
(marketStatsRaw as { item_cd: string; item_nm: string }[]).forEach(e => {
  if (e.item_cd && e.item_nm) {
    _nameToCode.set(e.item_nm, e.item_cd);
    _codeToName.set(e.item_cd, e.item_nm);
  }
});
export const itemNmToCode = (nm: string): string | undefined => _nameToCode.get(nm);
export const itemCdToNm  = (cd: string): string | undefined => _codeToName.get(cd);

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
  const lows = monthly.filter((m) => m.low != null).map((m) => m.low!)
  const highs = monthly.filter((m) => m.high != null).map((m) => m.high!)
  const yearMin = lows.length > 0 ? Math.min(...lows) : 0
  const yearMax = highs.length > 0 ? Math.max(...highs) : 0
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
          coverage: 1,
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

  const now = new Date()
  const CURRENT_YM = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

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

  // gradeGroup: 같은 item_cd + sgg_cd의 combos 모음 (allStats에서 item_cd 필터링)
  const combos = allStats?.filter((s) => s.item_cd === stat.item_cd) ?? await getItemStats(stat.item_cd, stat.sgg_cd)

  // 모든 combos의 monthly 데이터 로드 (Promise.all 병렬 배치)
  const uniqueCombos = combos.filter((combo, idx, arr) =>
    arr.findIndex((c) => c.grd_cd === combo.grd_cd && c.vrty_cd === combo.vrty_cd) === idx
  )
  const monthlyResults = await Promise.all(
    uniqueCombos.map((combo) =>
      getMonthlyPrices(combo.item_cd, combo.sgg_cd, combo.grd_cd, combo.vrty_cd)
    )
  )
  const monthlyMap = new Map<string, MonthlyPoint[]>()
  uniqueCombos.forEach((combo, i) => {
    const monthlyKey = `${combo.grd_cd}_${combo.vrty_cd}`
    const filtered = monthlyResults[i].filter((m) => m.ym !== CURRENT_YM)
    monthlyMap.set(monthlyKey, appendLatestYmPoint(filtered, combo.latest_ym?.slice(0, 6) || CURRENT_YM))
  })

  const gradeGroup = buildGradeGroup(combos, monthlyMap)

  const defaultGrade = gradeGroup?.grades.find((g) => g.is_default) ?? gradeGroup?.grades[0]
  const defaultVariety = defaultGrade?.varieties.find((v) => v.is_default) ?? defaultGrade?.varieties[0]

  const cheapnessInfo = getCheapnessInfo(
    stat.percentile || 0,
    stat.latest_price,
    trendMeta.yearMin,
    trendMeta.yearMax
  )

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
    grd_label: stat.grd_label ?? defaultGrade?.grd_label,
    vrty_label: stat.vrty_label ?? defaultVariety?.vrty_label,
    featuredGrdCd: stat.grd_cd,
    featuredVrtyCd: stat.vrty_cd,
    seCd: stat.se_cd as '01' | '02' | undefined,
    percentile: stat.percentile || 0,
    cheapness_label: cheapnessInfo.label,
    cheapness_explanation: cheapnessInfo.explanation,
  }
}

/**  지역 기반 저렴 품목 */
export async function getCheapItemsByRegion(sgg_cd: string, limit = 6): Promise<ItemDetail[]> {
  const cheapStats = await getCheapItems(sgg_cd, limit)

  // item_cd별로 가장 저렴한 combo 하나만 선택 (React key 중복 방지)
  const itemMap = new Map<string, MarketItemStats>()
  for (const stat of cheapStats) {
    if (!itemMap.has(stat.item_cd)) {
      itemMap.set(stat.item_cd, stat)
    }
  }

  // percentile 순서대로 정렬 후 limit개 선택
  const selectedStats = Array.from(itemMap.values())
    .sort((a, b) => (a.percentile || 0) - (b.percentile || 0))
    .slice(0, limit)

  const items = await Promise.all(selectedStats.map((stat) => statsToItemDetail(stat, cheapStats)))
  return items.filter((item): item is ItemDetail => item !== null)
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

  const allCombosGroups = Array.from(itemMap.values())
  const items = await Promise.all(
    allCombosGroups.map((combos) => {
      const defaultCombo = combos.find((c) => c.is_default) ?? combos[0]
      return statsToItemDetail(defaultCombo, combos)
    })
  )

  // ctgry → item_cd 순 정렬
  return items
    .filter((item): item is ItemDetail => item !== null)
    .sort((a, b) => a.id.localeCompare(b.id))
}
