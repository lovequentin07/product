/**
 * src/market/scripts/update-market.ts
 *
 * 공공데이터포털 농산물 가격 API 수집 + D1 갱신 스크립트
 * 로컬 파이프라인(analyze-market-region.ts)과 동일한 로직으로 처리
 * GitHub Actions에서 평일 매일 오전 10시(KST)에 자동 실행
 *
 * 사용법:
 *   npx tsx src/market/scripts/update-market.ts [--dry-run]
 *
 * 환경변수:
 *   DATA_GO_KR_API_KEY     공공데이터포털 API 키 (필수)
 *   CLOUDFLARE_API_TOKEN   wrangler D1 인증 (필수)
 *   CLOUDFLARE_ACCOUNT_ID  Cloudflare 계정 ID (필수)
 *   CLOUDFLARE_D1_DATABASE_ID  D1 DB ID (필수)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fetchAllPublicDataPrices, type PriceItem } from '@market/lib/api/public-data-client'

// =====================================================================
// 타입 정의
// =====================================================================

interface MonthlyPoint {
  ym: string
  high: number | null
  low: number | null
  avg: number | null
}

interface ComboKey {
  grd_cd: string
  vrty_cd: string
}

// =====================================================================
// 설정
// =====================================================================

const isDryRun = process.argv.includes('--dry-run')
const DB_NAME = 'apt-trade-db'
const TMP_SQL_FILE = path.join(process.cwd(), '.tmp/update-market.sql')
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

// ⚠️ 향후 개선: 동시 실행 방지 메커니즘
// GitHub Actions 무료 플랜은 스케줄 정확도 보장 안 함 (최대 15분 지연)
// → 두 개의 인스턴스가 동시에 실행될 수 있음
// → 해결책: Cloudflare D1 또는 KV에 분산 잠금 구현
// 예시 구현:
// ```typescript
// const lockKey = 'market-update-lock'
// const lockTtl = 3600 // 1시간
// const hasLock = await acquireLock(lockKey, lockTtl)
// if (!hasLock) { console.log('다른 인스턴스에서 실행 중'); process.exit(0) }
// try { /* 메인 로직 */ } finally { await releaseLock(lockKey) }
// ```

// 조회 기간: 최근 25개월 (현재월 + 과거 24개월)
function getDateRange(): { startYm: string; endYm: string } {
  const now = new Date()
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 1

  let startYear = endYear
  let startMonth = endMonth - 24

  if (startMonth <= 0) {
    startYear -= 1
    startMonth += 12
  }

  const startYm = `${startYear}${String(startMonth).padStart(2, '0')}`
  const endYm = `${endYear}${String(endMonth).padStart(2, '0')}`

  return { startYm, endYm }
}

// =====================================================================
// 통계 함수들 (로컬 파이프라인과 동일한 로직)
// =====================================================================

/** IQR 기반 이상치 제거 */
function removeOutliers(values: number[]): number[] {
  if (values.length <= 2) return values

  const sorted = [...values].sort((a, b) => a - b)
  const q1Idx = Math.floor(sorted.length * 0.25)
  const q3Idx = Math.floor(sorted.length * 0.75)
  const q1 = sorted[q1Idx]
  const q3 = sorted[q3Idx]
  const iqr = q3 - q1
  const lower = q1 - 1.5 * iqr
  const upper = q3 + 1.5 * iqr

  return values.filter((v) => v >= lower && v <= upper)
}

/** 월별 데이터 집계 (이상치 제거 포함) */
function buildMonthly(rows: PriceItem[]): MonthlyPoint[] {
  const monthMap = new Map<string, PriceItem[]>()

  for (const row of rows) {
    const ym = row.exmn_ym
    if (!monthMap.has(ym)) monthMap.set(ym, [])
    monthMap.get(ym)!.push(row)
  }

  const monthly: MonthlyPoint[] = []

  for (const [ym, monthRows] of [...monthMap.entries()].sort()) {
    const highs = monthRows
      .map((r) => (r.pmm_hgprc ? Number(r.pmm_hgprc) : null))
      .filter((v) => v !== null) as number[]
    const lows = monthRows
      .map((r) => (r.pmm_lwprc ? Number(r.pmm_lwprc) : null))
      .filter((v) => v !== null) as number[]
    const avgs = monthRows
      .map((r) => (r.pmm_avgprc ? Number(r.pmm_avgprc) : null))
      .filter((v) => v !== null) as number[]

    const filteredHighs = removeOutliers(highs)
    const filteredLows = removeOutliers(lows)
    const filteredAvgs = removeOutliers(avgs)

    const high = filteredHighs.length > 0 ? Math.round(filteredHighs.reduce((s, v) => s + v, 0) / filteredHighs.length) : null
    const low = filteredLows.length > 0 ? Math.round(filteredLows.reduce((s, v) => s + v, 0) / filteredLows.length) : null
    const avg = filteredAvgs.length > 0 ? Math.round(filteredAvgs.reduce((s, v) => s + v, 0) / filteredAvgs.length) : null

    monthly.push({ ym, high, low, avg })
  }

  return monthly
}

/** Percentile 및 cheapness_score 계산 */
function calcScores(monthly: MonthlyPoint[], latestPrice: number): { percentile: number; cheapness_score: number } {
  const avgs = monthly.map((m) => m.avg).filter((v) => v !== null) as number[]

  if (avgs.length === 0) {
    return { percentile: 0.5, cheapness_score: 0 }
  }

  // percentile: 현재 가격보다 낮은 평균가의 비율
  const lowerCount = avgs.filter((v) => v <= latestPrice).length
  const percentile = lowerCount / avgs.length

  // cheapness_score: (mean - latestPrice) / std
  const mean = avgs.reduce((s, v) => s + v, 0) / avgs.length
  const variance = avgs.reduce((s, v) => s + (v - mean) ** 2, 0) / avgs.length
  const std = Math.sqrt(variance)
  const cheapness_score = std > 0 ? (mean - latestPrice) / std : 0

  return { percentile, cheapness_score }
}

// =====================================================================
// 헬퍼 함수
// =====================================================================

function esc(s: string | null | undefined): string {
  if (s == null) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function num(v: string | number | null | undefined): string {
  if (v == null || v === '') return 'NULL'
  const n = Number(v)
  return isNaN(n) ? 'NULL' : String(n)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureTmpDir(): void {
  const tmpDir = path.dirname(TMP_SQL_FILE)
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }
}

// =====================================================================
// SQL 생성
// =====================================================================

/**
 * market_monthly_prices UPSERT SQL 생성
 */
function buildMonthlyInsert(
  item_cd: string,
  sgg_cd: string,
  grd_cd: string,
  vrty_cd: string,
  monthly: MonthlyPoint[]
): string[] {
  const sqls: string[] = []

  for (const m of monthly) {
    if (m.avg !== null) {
      const sql = `INSERT INTO market_monthly_prices (item_cd, sgg_cd, grd_cd, vrty_cd, ym, high_price, low_price, avg_price)
VALUES (${esc(item_cd)}, ${esc(sgg_cd)}, ${esc(grd_cd)}, ${esc(vrty_cd)}, ${esc(m.ym)}, ${num(m.high)}, ${num(m.low)}, ${num(m.avg)})
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd, ym) DO UPDATE SET
  avg_price = excluded.avg_price,
  high_price = excluded.high_price,
  low_price = excluded.low_price;`
      sqls.push(sql)
    }
  }

  return sqls
}

/**
 * market_item_stats UPSERT SQL 생성
 */
function buildStatsUpsert(
  item: PriceItem,
  combo: ComboKey,
  sgg_cd: string,
  sgg_nm: string,
  latestPrice: number,
  percentile: number,
  cheapness_score: number,
  isDefault: boolean
): string {
  const latestYm = `${item.exmn_ym}15`

  return `INSERT INTO market_item_stats (
  item_cd, item_nm, ctgry_cd, ctgry_nm, sgg_cd, sgg_nm, se_cd, unit, unit_sz,
  grd_cd, grd_label, vrty_cd, vrty_label, is_default, latest_price, latest_ymd, percentile, cheapness_score, updated_at
) VALUES (
  ${esc(item.item_cd)}, ${esc(item.item_nm)}, ${esc(item.ctgry_cd)}, ${esc(item.ctgry_nm)},
  ${esc(sgg_cd)}, ${esc(sgg_nm)}, ${esc(item.se_cd)}, ${esc(item.unit)}, ${esc(item.unit_sz)},
  ${esc(combo.grd_cd)}, ${esc(item.grd_nm)}, ${esc(combo.vrty_cd)}, ${esc(item.vrty_nm)},
  ${isDefault ? 1 : 0}, ${num(latestPrice)}, ${esc(latestYm)}, ${percentile.toFixed(4)}, ${cheapness_score.toFixed(4)}, datetime('now')
)
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd) DO UPDATE SET
  latest_price = excluded.latest_price,
  latest_ymd = excluded.latest_ymd,
  percentile = excluded.percentile,
  cheapness_score = excluded.cheapness_score,
  updated_at = datetime('now');`
}

// =====================================================================
// SQL 실행
// =====================================================================

async function runSQL(sql: string, label: string, attempt = 1): Promise<void> {
  if (isDryRun) {
    console.log(`[dry-run] ${label}`)
    return
  }

  console.log(`  ${label}`)
  ensureTmpDir()
  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8')

  try {
    execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`, { stdio: 'pipe' })
  } catch (e) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt
      console.log(`  재시도 ${attempt}/${MAX_RETRIES - 1} (${delay / 1000}s 후)...`)
      await sleep(delay)
      return runSQL(sql, label, attempt + 1)
    }
    throw e
  }
}

// =====================================================================
// 메인 로직
// =====================================================================

async function main() {
  const startTime = Date.now()
  const { startYm, endYm } = getDateRange()

  console.log(`
🚀 공공데이터포털 농산물 가격 수집 + D1 갱신 시작 (로컬 파이프라인과 동일 로직)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  시작: ${new Date().toISOString()}
  기간: ${startYm} ~ ${endYm} (25개월)
  API: https://apis.data.go.kr/B552845/perYearMonth/price
${isDryRun ? '  [dry-run] 실제 실행하지 않음' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)

  // 1. 공공데이터포털에서 데이터 수집
  console.log('📊 공공데이터포털에서 데이터 수집 중...')

  let items: PriceItem[] = []

  try {
    items = await fetchAllPublicDataPrices(startYm, endYm, (current, total) => {
      if (current % 1000 === 0 || current === total) {
        console.log(`  진행: ${current}/${total}`)
      }
    })
  } catch (error) {
    console.error('❌ 데이터 수집 실패:', error)
    process.exit(1)
  }

  console.log(`✅ 데이터 수집 완료: ${items.length}건`)

  // 2. 품목×지역×등급×신선도별 그룹화
  console.log('\n📋 데이터 그룹화 중...')

  interface ComboKey {
    item_cd: string
    sgg_cd: string
    grd_cd: string
    vrty_cd: string
  }

  const comboMap = new Map<string, PriceItem[]>()

  for (const item of items) {
    const key = `${item.item_cd}|${item.sgg_cd || '1100'}|${item.grd_cd}|${item.vrty_cd}`
    if (!comboMap.has(key)) comboMap.set(key, [])
    comboMap.get(key)!.push(item)
  }

  console.log(`✅ 조합 개수: ${comboMap.size}개`)

  // 3. 품목별 se_cd 자동 결정
  console.log('\n🔍 품목별 se_cd(소매/도매) 결정 중...')

  const itemToSeCd = new Map<string, string>()

  for (const item_cd of new Set(items.map((i) => i.item_cd))) {
    const itemRows = items.filter((i) => i.item_cd === item_cd)
    const wholesaleRows = itemRows.filter((r) => r.se_cd === '02')
    const wholesaleLatest = wholesaleRows.length > 0 ? Math.max(...wholesaleRows.map((r) => parseInt(r.exmn_ym))) : 0

    // 도매가가 최근(202601 이상)에 있으면 도매가 선택, 없으면 소매가
    const seCd = wholesaleLatest >= 202601 ? '02' : '01'
    itemToSeCd.set(item_cd, seCd)
  }

  // 4. SQL 생성
  console.log('\n💾 D1 적재용 SQL 생성 중...')

  const monthlyInserts: string[] = []
  const statsUpserts: string[] = []

  // combo별로 순회하며 SQL 생성
  for (const [comboKeyStr, rows] of comboMap.entries()) {
    const [item_cd, sgg_cd_raw, grd_cd, vrty_cd] = comboKeyStr.split('|')
    const sgg_cd = sgg_cd_raw || '1100'

    // se_cd 필터링: 품목별로 결정된 se_cd만 사용
    const seCd = itemToSeCd.get(item_cd) || '01'
    const filteredRows = rows.filter((r) => r.se_cd === seCd)

    if (filteredRows.length === 0) continue

    const sample = filteredRows[0]
    const sgg_nm = sample.sgg_nm || '전국'

    // 월별 데이터 집계
    const monthly = buildMonthly(filteredRows)

    if (monthly.length === 0) continue

    // 최신 가격
    const latestAvg = monthly[monthly.length - 1]?.avg
    if (!latestAvg) continue

    // Percentile 및 cheapness_score 계산
    const { percentile, cheapness_score } = calcScores(monthly, latestAvg)

    // Monthly inserts 생성
    const monthlyStmts = buildMonthlyInsert(item_cd, sgg_cd, grd_cd, vrty_cd, monthly)
    monthlyInserts.push(...monthlyStmts)

    // Stats upsert 생성
    const statsStmt = buildStatsUpsert(
      sample,
      { grd_cd, vrty_cd },
      sgg_cd,
      sgg_nm,
      latestAvg,
      percentile,
      cheapness_score,
      false // is_default은 아래에서 결정
    )
    statsUpserts.push(statsStmt)
  }

  console.log(`  - market_monthly_prices: ${monthlyInserts.length}개`)
  console.log(`  - market_item_stats: ${statsUpserts.length}개 (임시, is_default 미결정)`)

  // 5. is_default 결정: 지역별로 품목당 가장 흔한 등급/신선도 조합
  //    예: 무(231) 서울(1101)에서 가장 많이 거래되는 것이 '상(04)/월동(01)'이면
  //    그 조합을 is_default=1로 표시. 사용자가 상세페이지에 진입할 때 기본으로 표시될 데이터.
  console.log('\n✨ is_default 조합 결정 중...')

  const itemRegionComboFreq = new Map<string, Map<string, number>>()

  // 각 combo의 출현 빈도 집계 (같은 item×region×grd×vrty 조합이 API에 얼마나 자주 나타났는가)
  for (const [comboKeyStr, rows] of comboMap.entries()) {
    const [item_cd, sgg_cd_raw, grd_cd, vrty_cd] = comboKeyStr.split('|')
    const sgg_cd = sgg_cd_raw || '1100'

    // se_cd 필터링: 이미 결정된 도매/소매 기준으로 필터링
    const seCd = itemToSeCd.get(item_cd) || '01'
    const filteredRows = rows.filter((r) => r.se_cd === seCd)

    if (filteredRows.length === 0) continue

    const key = `${item_cd}|${sgg_cd}`
    if (!itemRegionComboFreq.has(key)) {
      itemRegionComboFreq.set(key, new Map())
    }

    // grd_cd|vrty_cd 조합의 빈도 증가 (같은 조합이 얼마나 자주 나타났는가)
    const comboKey = `${grd_cd}|${vrty_cd}`
    const freq = itemRegionComboFreq.get(key)!
    freq.set(comboKey, (freq.get(comboKey) || 0) + filteredRows.length)
  }

  // 각 item×region별로 빈도가 가장 높은 combo 선택 (is_default 후보)
  const defaultCombos = new Map<string, string>()
  for (const [itemRegion, comboFreq] of itemRegionComboFreq.entries()) {
    const maxCombo = [...comboFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    if (maxCombo) {
      defaultCombos.set(itemRegion, maxCombo)
    }
  }

  // 6. is_default 플래그로 statsUpserts 재생성
  console.log('🔧 is_default 플래그 적용 중...')

  const finalStatsUpserts: string[] = []

  for (const [comboKeyStr, rows] of comboMap.entries()) {
    const [item_cd, sgg_cd_raw, grd_cd, vrty_cd] = comboKeyStr.split('|')
    const sgg_cd = sgg_cd_raw || '1100'

    const seCd = itemToSeCd.get(item_cd) || '01'
    const filteredRows = rows.filter((r) => r.se_cd === seCd)

    if (filteredRows.length === 0) continue

    const sample = filteredRows[0]
    const sgg_nm = sample.sgg_nm || '전국'

    const monthly = buildMonthly(filteredRows)
    if (monthly.length === 0) continue

    const latestAvg = monthly[monthly.length - 1]?.avg
    if (!latestAvg) continue

    const { percentile, cheapness_score } = calcScores(monthly, latestAvg)

    // is_default 결정
    const itemRegionKey = `${item_cd}|${sgg_cd}`
    const defaultComboStr = defaultCombos.get(itemRegionKey)
    const currentComboStr = `${grd_cd}|${vrty_cd}`
    const isDefault = defaultComboStr === currentComboStr

    const statsStmt = buildStatsUpsert(
      sample,
      { grd_cd, vrty_cd },
      sgg_cd,
      sgg_nm,
      latestAvg,
      percentile,
      cheapness_score,
      isDefault
    )
    finalStatsUpserts.push(statsStmt)
  }

  // 7. D1에 UPSERT
  console.log('\n📝 D1에 데이터 적재 중...')

  if (monthlyInserts.length > 0) {
    const sql = monthlyInserts.join('\n')
    await runSQL(sql, `월별 데이터 UPSERT (${monthlyInserts.length}개)`)
  }

  if (finalStatsUpserts.length > 0) {
    const sql = finalStatsUpserts.join('\n')
    await runSQL(sql, `통계 데이터 UPSERT (${finalStatsUpserts.length}개)`)
  }

  // 8. 메타데이터 저장
  if (!isDryRun) {
    const metadata = {
      lastUpdated: new Date().toISOString(),
      period: { startYm, endYm },
      comboCount: finalStatsUpserts.length,
      source: 'public-data-api',
      logic: 'analyze-market-region.ts와 동일',
    }

    ensureTmpDir()
    fs.writeFileSync(
      path.join(process.cwd(), '.tmp/market-update-metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )
  }

  const elapsedMs = Date.now() - startTime
  const elapsedSec = (elapsedMs / 1000).toFixed(2)

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 공공데이터포털 농산물 가격 수집 + D1 갱신 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  수집 기간: ${startYm} ~ ${endYm}
  총 API 행: ${items.length}건
  조합(품목×지역×등급×신선도): ${finalStatsUpserts.length}개
  월별 데이터: ${monthlyInserts.length}개 UPSERT
  통계 데이터: ${finalStatsUpserts.length}개 UPSERT (is_default 포함)
  ⏱️  실행 시간: ${elapsedSec}초

📊 생성된 데이터:
  - percentile: 과거 12개월 대비 현재 가격의 상대 순위 (0~1)
  - cheapness_score: (평균 - 현재가) / 표준편차
  - is_default: 각 지역별 품목당 가장 흔한 등급/신선도 조합

🔔 다음 자동 실행: 평일 오전 10시 KST (UTC 01:00)
  `)
}

main().catch((err) => {
  console.error('❌ 오류:', err.message)
  process.exit(1)
})
