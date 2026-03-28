/**
 * src/market/lib/db/market.ts
 * 농산물 시세 D1 쿼리 레이어 + mock fallback
 */

import { MarketItemStats, MonthlyPriceRow, DailyPriceRow } from '@market/types/market'

// =====================================================================
// Type 정의 (DB 행)
// =====================================================================

type ItemStatsRow = {
  id: number
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  sgg_cd: string
  sgg_nm: string
  se_cd: string | null
  unit: string
  unit_sz: string
  grd_cd: string
  grd_label: string | null
  vrty_cd: string
  vrty_label: string | null
  is_default: number
  latest_price: number | null
  latest_ymd: string | null
  percentile: number | null
  cheapness_score: number | null
  updated_at: string | null
}

type MonthlyPriceRowDB = {
  item_cd: string
  sgg_cd: string
  grd_cd: string
  vrty_cd: string
  ym: string
  high_price: number | null
  low_price: number | null
  avg_price: number | null
}

type DailyPriceRowDB = {
  item_cd: string
  sgg_cd: string
  grd_cd: string
  vrty_cd: string
  ymd: string
  high_price: number | null
  low_price: number | null
  avg_price: number | null
}

// =====================================================================
// Mock 데이터 (로컬 개발용)
// =====================================================================

import marketDataJson from '@market/data/market-stats-by-region.json'

function getMockItemStats(sgg_cd?: string): MarketItemStats[] {
  const allCombos: MarketItemStats[] = []

  for (const region of marketDataJson) {
    if (sgg_cd && region.sgg_cd !== sgg_cd) continue

    for (const combo of region.combos) {
      allCombos.push({
        item_cd: region.item_cd,
        item_nm: region.item_nm,
        ctgry_cd: region.ctgry_cd,
        ctgry_nm: region.ctgry_nm,
        sgg_cd: region.sgg_cd,
        sgg_nm: region.sgg_nm,
        se_cd: region.se_cd,
        unit: region.unit,
        unit_sz: region.unit_sz,
        grd_cd: combo.grd_cd,
        grd_label: combo.grd_label,
        vrty_cd: combo.vrty_cd,
        vrty_label: combo.vrty_label,
        is_default: combo.is_default ? 1 : 0,
        latest_price: combo.latest_price,
        latest_ym: `${combo.latest_ym}01`, // YYYYMM → YYYYMMDD (1일로 통일)
        percentile: combo.percentile,
        cheapness_score: combo.cheapness_score,
      })
    }
  }

  return allCombos
}

function getMockMonthlyPrices(
  item_cd: string,
  sgg_cd: string,
  grd_cd: string,
  vrty_cd: string
): MonthlyPriceRow[] {
  const item = marketDataJson.find((r) => r.item_cd === item_cd && r.sgg_cd === sgg_cd)
  if (!item) return []

  const combo = item.combos.find((c) => c.grd_cd === grd_cd && c.vrty_cd === vrty_cd)
  if (!combo) return []

  return combo.monthly
    .filter((m) => m.avg !== null)
    .map((m) => ({
      ym: m.ym,
      high: m.high,
      low: m.low,
      avg: m.avg,
    }))
}

// =====================================================================
// Public API
// =====================================================================

/**
 * 지역별 저렴 품목 조회 (상위 limit개, percentile < 0.5 & is_default = 1 필터링)
 */
export async function getCheapItems(sgg_cd: string, limit: number = 10): Promise<MarketItemStats[]> {
  let db: D1Database | null = null
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext()
    db = (env as unknown as { DB: D1Database }).DB ?? null
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    // 로컬 mock fallback
    const allStats = getMockItemStats(sgg_cd)
    return allStats
      .filter((s) => s.percentile !== null && s.percentile < 0.5 && s.is_default === 1)
      .sort((a, b) => {
        if (a.percentile === null || b.percentile === null) return 0
        return a.percentile - b.percentile
      })
      .slice(0, limit)
  }

  // D1 쿼리
  const result = await db.prepare(
    `
    SELECT * FROM market_item_stats
    WHERE sgg_cd = ? AND percentile < 0.5 AND is_default = 1
    ORDER BY percentile ASC, cheapness_score DESC
    LIMIT ?
    `
  )
    .bind(sgg_cd, limit)
    .all<ItemStatsRow>()

  return (result.results || []).map((row) => rowToMarketItemStats(row))
}

/**
 * 지역별 모든 통계 조회 (페이지네이션 없음, 홈페이지용 카테고리 필터)
 */
export async function getItemStatsByRegion(sgg_cd: string, ctgry_cd?: string): Promise<MarketItemStats[]> {
  let db: D1Database | null = null
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext()
    db = (env as unknown as { DB: D1Database }).DB ?? null
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    let stats = getMockItemStats(sgg_cd)
    if (ctgry_cd) {
      stats = stats.filter((s) => s.ctgry_cd === ctgry_cd)
    }
    return stats
  }

  // D1 쿼리
  let query = `SELECT * FROM market_item_stats WHERE sgg_cd = ?`
  const params: unknown[] = [sgg_cd]

  if (ctgry_cd) {
    query += ` AND ctgry_cd = ?`
    params.push(ctgry_cd)
  }

  query += ` ORDER BY is_default DESC, item_cd ASC`

  const result = await db.prepare(query).bind(...params).all<ItemStatsRow>()

  return (result.results || []).map((row) => rowToMarketItemStats(row))
}

/**
 * 품목×지역 통계 조회 (여러 combo 포함)
 */
export async function getItemStats(item_cd: string, sgg_cd: string): Promise<MarketItemStats[]> {
  let db: D1Database | null = null
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext()
    db = (env as unknown as { DB: D1Database }).DB ?? null
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    const stats = getMockItemStats(sgg_cd).filter((s) => s.item_cd === item_cd)
    return stats
  }

  // D1 쿼리
  const result = await db.prepare(
    `
    SELECT * FROM market_item_stats
    WHERE item_cd = ? AND sgg_cd = ?
    ORDER BY is_default DESC, grd_cd ASC, vrty_cd ASC
    `
  )
    .bind(item_cd, sgg_cd)
    .all<ItemStatsRow>()

  return (result.results || []).map((row) => rowToMarketItemStats(row))
}

/**
 * 월별 시세 이력 조회 (차트용)
 */
export async function getMonthlyPrices(
  item_cd: string,
  sgg_cd: string,
  grd_cd: string,
  vrty_cd: string
): Promise<MonthlyPriceRow[]> {
  let db: D1Database | null = null
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext()
    db = (env as unknown as { DB: D1Database }).DB ?? null
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    return getMockMonthlyPrices(item_cd, sgg_cd, grd_cd, vrty_cd)
  }

  // D1 쿼리
  const result = await db.prepare(
    `
    SELECT ym, high_price as high, low_price as low, avg_price as avg
    FROM market_monthly_prices
    WHERE item_cd = ? AND sgg_cd = ? AND grd_cd = ? AND vrty_cd = ?
    ORDER BY ym ASC
    `
  )
    .bind(item_cd, sgg_cd, grd_cd, vrty_cd)
    .all<{ ym: string; high: number | null; low: number | null; avg: number | null }>()

  return (result.results || []).map((row) => ({
    ym: row.ym,
    high: row.high,
    low: row.low,
    avg: row.avg,
  }))
}

/**
 * 일별 시세 이력 조회 (단기 트렌드용, 최근 N일)
 */
export async function getDailyPrices(
  item_cd: string,
  sgg_cd: string,
  grd_cd: string,
  vrty_cd: string,
  days: number = 30
): Promise<DailyPriceRow[]> {
  let db: D1Database | null = null
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext()
    db = (env as unknown as { DB: D1Database }).DB ?? null
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    // 로컬: 일별 mock 없음 → 빈 배열 반환
    return []
  }

  // D1 쿼리
  const result = await db.prepare(
    `
    SELECT ymd, high_price as high, low_price as low, avg_price as avg
    FROM market_daily_prices
    WHERE item_cd = ? AND sgg_cd = ? AND grd_cd = ? AND vrty_cd = ?
    ORDER BY ymd DESC
    LIMIT ?
    `
  )
    .bind(item_cd, sgg_cd, grd_cd, vrty_cd, days)
    .all<{ ymd: string; high: number | null; low: number | null; avg: number | null }>()

  return ((result.results || []).reverse() as { ymd: string; high: number | null; low: number | null; avg: number | null }[]).map((row) => ({
    ymd: row.ymd,
    high: row.high,
    low: row.low,
    avg: row.avg,
  }))
}

// =====================================================================
// Helper: Row → Type 변환
// =====================================================================

function rowToMarketItemStats(row: ItemStatsRow): MarketItemStats {
  return {
    item_cd: row.item_cd,
    item_nm: row.item_nm,
    ctgry_cd: row.ctgry_cd,
    ctgry_nm: row.ctgry_nm,
    sgg_cd: row.sgg_cd,
    sgg_nm: row.sgg_nm,
    se_cd: row.se_cd,
    unit: row.unit,
    unit_sz: row.unit_sz,
    grd_cd: row.grd_cd,
    grd_label: row.grd_label,
    vrty_cd: row.vrty_cd,
    vrty_label: row.vrty_label,
    is_default: row.is_default,
    latest_price: row.latest_price,
    latest_ym: row.latest_ymd, // DB: latest_ymd, API: latest_ym
    percentile: row.percentile,
    cheapness_score: row.cheapness_score,
  }
}
