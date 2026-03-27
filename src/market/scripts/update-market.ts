/**
 * src/market/scripts/update-market.ts
 *
 * 공공데이터포털 농산물 가격 API 수집 + D1 갱신 스크립트
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
import { fetchAllPublicDataPrices, filterRetailPrices, type PriceItem } from '@market/lib/api/public-data-client'

// =====================================================================
// 설정
// =====================================================================

const isDryRun = process.argv.includes('--dry-run')
const DB_NAME = 'apt-trade-db'
const TMP_SQL_FILE = path.join(process.cwd(), '.tmp/update-market.sql')
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

// 조회 기간: 최근 13개월 (현재월 + 과거 12개월)
function getDateRange(): { startYm: string; endYm: string } {
  const now = new Date()
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 1

  let startYear = endYear
  let startMonth = endMonth - 12

  if (startMonth <= 0) {
    startYear -= 1
    startMonth += 12
  }

  const startYm = `${startYear}${String(startMonth).padStart(2, '0')}`
  const endYm = `${endYear}${String(endMonth).padStart(2, '0')}`

  return { startYm, endYm }
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
 *
 * 공공데이터 API 응답:
 *   pmm_avgprc: 월평균가격
 *   pmm_hgprc: 월최고가
 *   pmm_lwprc: 월최저가
 */
function buildMonthlyInsert(item: PriceItem, sggCd: string): string {
  // 지역 코드와 지역명 매핑 (추후 개선 가능)
  const sggNm = '전국' // 공공데이터는 지역 정보 없음 → 임시로 "전국"

  return `INSERT INTO market_monthly_prices (item_cd, sgg_cd, grd_cd, vrty_cd, ym, high_price, low_price, avg_price)
VALUES (${esc(item.item_cd)}, ${esc(sggCd)}, ${esc(item.grd_cd)}, ${esc(item.vrty_cd)}, ${esc(item.exmn_ym)}, ${num(item.pmm_hgprc)}, ${num(item.pmm_lwprc)}, ${num(item.pmm_avgprc)})
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd, ym) DO UPDATE SET
  avg_price = excluded.avg_price,
  high_price = excluded.high_price,
  low_price = excluded.low_price;`
}

/**
 * market_item_stats UPSERT SQL 생성
 *
 * ⚠️ 공공데이터는 월별 집계 데이터만 제공 (일별 데이터 없음)
 * → latest_ym은 최신 월, latest_price는 그 달의 avg_price
 * → percentile은 향후 계산 (현재 NULL)
 */
function buildStatsUpsert(
  item: PriceItem,
  sggCd: string,
  sggNm: string,
  latestPrice: string | null
): string {
  const latestYm = `${item.exmn_ym}15` // 월 중순 기준 (YYYYMMDD)

  return `INSERT INTO market_item_stats (
  item_cd, item_nm, ctgry_cd, ctgry_nm, sgg_cd, sgg_nm, se_cd, unit, unit_sz,
  grd_cd, grd_label, vrty_cd, vrty_label, is_default, latest_price, latest_ymd, percentile, cheapness_score, updated_at
) VALUES (
  ${esc(item.item_cd)}, ${esc(item.item_nm)}, ${esc(item.ctgry_cd)}, ${esc(item.ctgry_nm)},
  ${esc(sggCd)}, ${esc(sggNm)}, ${esc(item.se_cd)}, ${esc(item.unit)}, ${esc(item.unit_sz)},
  ${esc(item.grd_cd)}, ${esc(item.grd_nm)}, ${esc(item.vrty_cd)}, ${esc(item.vrty_nm)},
  0, ${num(latestPrice)}, ${esc(latestYm)}, NULL, NULL, datetime('now')
)
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd) DO UPDATE SET
  latest_price = excluded.latest_price,
  latest_ymd = excluded.latest_ymd,
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
    execSync(
      `npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`,
      { stdio: 'pipe' }
    )
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
  const { startYm, endYm } = getDateRange()

  console.log(`
🚀 공공데이터포털 농산물 가격 수집 + D1 갱신 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  기간: ${startYm} ~ ${endYm}
  API: https://apis.data.go.kr/B552845/perYearMonth/price
${isDryRun ? '  [dry-run] 실제 실행하지 않음' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // 2. 소매가('01') 필터링
  const retailItems = filterRetailPrices(items)
  console.log(`✅ 소매가 필터링: ${retailItems.length}건`)

  // 3. SQL 생성
  console.log('\n💾 D1 적재용 SQL 생성 중...')

  const monthlyInserts: string[] = []
  const statsUpserts: string[] = []

  // 공공데이터는 지역 정보 없음 → 전국("1100") 기준으로 처리
  const sggCd = '1100'
  const sggNm = '전국'

  for (const item of retailItems) {
    monthlyInserts.push(buildMonthlyInsert(item, sggCd))
    statsUpserts.push(buildStatsUpsert(item, sggCd, sggNm, item.pmm_avgprc))
  }

  console.log(`  - market_monthly_prices: ${monthlyInserts.length}개`)
  console.log(`  - market_item_stats: ${statsUpserts.length}개`)

  // 4. D1에 UPSERT
  console.log('\n📝 D1에 데이터 적재 중...')

  if (monthlyInserts.length > 0) {
    const sql = monthlyInserts.join('\n')
    await runSQL(sql, `월별 데이터 UPSERT (${monthlyInserts.length}개)`)
  }

  if (statsUpserts.length > 0) {
    const sql = statsUpserts.join('\n')
    await runSQL(sql, `통계 데이터 UPSERT (${statsUpserts.length}개)`)
  }

  // 5. 메타데이터 저장
  if (!isDryRun) {
    const metadata = {
      lastUpdated: new Date().toISOString(),
      period: { startYm, endYm },
      itemCount: retailItems.length,
      source: 'public-data-api',
    }

    ensureTmpDir()
    fs.writeFileSync(
      path.join(process.cwd(), '.tmp/market-update-metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 공공데이터포털 농산물 가격 수집 + D1 갱신 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - 수집 기간: ${startYm} ~ ${endYm}
  - 소매가 데이터: ${retailItems.length}건
  - 월별 데이터: ${monthlyInserts.length}개 UPSERT
  - 통계 데이터: ${statsUpserts.length}개 UPSERT
  `)

  console.log(`
📌 주의사항:
  - 지역 정보: 공공데이터 API는 지역 미포함 → 현재 "전국(1100)" 기준
  - Percentile: 향후 계산 필요 (현재 NULL)
  - 일별 데이터: 공공데이터는 월별만 제공
  `)
}

main().catch((err) => {
  console.error('❌ 오류:', err.message)
  process.exit(1)
})
