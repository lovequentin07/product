import dailyStatsRaw from '@/data/market-daily-stats.json'
import marketStatsRaw from '@/data/market-stats.json'
import gradeGroupsRaw from '@/data/market-stats-grades.json'
import { Category, GradeGroup, ItemDetail, PricePoint, TrendMeta } from '@/types/market'

// ----------------------------------------------------------------
// 원본 JSON 타입 정의
// ----------------------------------------------------------------
interface DailyStat {
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  exmn_ymd: string
  latest_price: number
  unit: string
  unit_sz: string
  days_ago: number
  avg_avg_price: number
  all_time_high: number
  all_time_low: number
  vs_avg_rate: number
  range_pct: number
  grd_cd?: string
  grd_label?: string
  vrty_cd?: string
  vrty_label?: string
}

interface MonthlyPoint {
  ym: string
  high: number
  low: number
  avg: number
}

interface MarketStat {
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  unit: string
  unit_sz: string
  all_time_high: number
  all_time_low: number
  avg_avg_price: number
  data_count: number
  monthly: MonthlyPoint[]
}

// ----------------------------------------------------------------
// ctgry_cd → Category 매핑
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
// unit 표시 문자열 생성
// unit_sz==="1" → unit 그대로, 아니면 unit_sz+unit
// ----------------------------------------------------------------
function buildUnitDisplay(unit: string, unit_sz: string): string {
  return unit_sz === '1' ? unit : `${unit_sz}${unit}`
}

// ----------------------------------------------------------------
// monthly[] → PricePoint[] (월당 3포인트: 1일=low, 14일=avg, 28일=high)
// ----------------------------------------------------------------
function monthlyToTrend(monthly: MonthlyPoint[]): PricePoint[] {
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

// ----------------------------------------------------------------
// TrendMeta 생성
// ----------------------------------------------------------------
function buildTrendMeta(
  daily: DailyStat,
  monthly: MonthlyPoint[],
): TrendMeta {
  // yearMin/yearMax는 all_time_low/high 기준
  return {
    yearMin: daily.all_time_low,
    yearMax: daily.all_time_high,
    yearAvg: Math.round(daily.avg_avg_price),
    yearMinDate: '',
    yearMaxDate: '',
    vsYearAvgRate: daily.vs_avg_rate,
  }
}

// ----------------------------------------------------------------
// Join + 변환
// ----------------------------------------------------------------
const dailyStats = dailyStatsRaw as DailyStat[]
const marketStats = marketStatsRaw as MarketStat[]
const gradeGroups = gradeGroupsRaw as Record<string, GradeGroup>

// item_cd 기준으로 market-stats 인덱싱
const statsMap = new Map<string, MarketStat>()
for (const s of marketStats) {
  statsMap.set(s.item_cd, s)
}

// daily-stats 기준으로 ItemDetail 생성 (stats에 있어야 trend 생성 가능)
const ALL_ITEMS: ItemDetail[] = dailyStats
  .map((d): ItemDetail | null => {
    const stat = statsMap.get(d.item_cd)
    if (!stat) return null

    const unitDisplay = buildUnitDisplay(d.unit, d.unit_sz)
    const trend = monthlyToTrend(stat.monthly)
    const trendMeta = buildTrendMeta(d, stat.monthly)

    const gradeGroup = gradeGroups[d.item_cd] as GradeGroup | undefined

    return {
      id: d.item_cd,
      name: d.item_nm,
      category: ctgryToCategory(d.ctgry_cd),
      unit: unitDisplay,
      kinds: [
        {
          kind: '상',
          retailPrice: d.latest_price,
          wholesalePrice: 0,
          // dayChange/weekChange 생략 (optional)
        },
      ],
      trend,
      trendMeta,
      martPrices: [],
      tips: [],
      gradeGroup,
      grd_label: d.grd_label,
      vrty_label: d.vrty_label,
      featuredGrdCd: d.grd_cd,
      featuredVrtyCd: d.vrty_cd,
    }
  })
  .filter((item): item is ItemDetail => item !== null)
  // ctgry_cd 오름차순 정렬 (원본 daily-stats의 ctgry_cd 순서 유지)
  .sort((a, b) => {
    const cdA = dailyStats.find((d) => d.item_cd === a.id)?.ctgry_cd ?? ''
    const cdB = dailyStats.find((d) => d.item_cd === b.id)?.ctgry_cd ?? ''
    return cdA.localeCompare(cdB)
  })

// ----------------------------------------------------------------
// export 함수
// ----------------------------------------------------------------

/** 전체 품목 (87개) */
export function getAllItems(): ItemDetail[] {
  return ALL_ITEMS
}

/** slug(=item_cd)로 단일 품목 조회 */
export function getItemBySlug(slug: string): ItemDetail | undefined {
  return ALL_ITEMS.find((i) => i.id === slug)
}

// 자주 찾는 품목 (고정 순서)
const POPULAR_IDS = ['111', '211', '231', '245', '411', '415', '226', '225', '214', '223', '232', '151']

/** 자주 찾는 품목 (최대 8개) */
export function getPopularItems(limit = 8): ItemDetail[] {
  return POPULAR_IDS
    .map((id) => ALL_ITEMS.find((i) => i.id === id))
    .filter((i): i is ItemDetail => i !== undefined)
    .slice(0, limit)
}

/**
 * 저렴 품목 필터: range_pct < threshold (%)
 * vs_avg_rate 오름차순 (더 저렴한 것이 앞)
 */
export function getDropItems(threshold = 40): ItemDetail[] {
  const dailyMap = new Map<string, DailyStat>()
  for (const d of dailyStats) {
    dailyMap.set(d.item_cd, d)
  }

  return ALL_ITEMS.filter((item) => {
    const d = dailyMap.get(item.id)
    if (!d) return false
    return d.range_pct < threshold
  }).sort((a, b) => {
    const da = dailyMap.get(a.id)
    const db = dailyMap.get(b.id)
    return (da?.vs_avg_rate ?? 0) - (db?.vs_avg_rate ?? 0)
  })
}
