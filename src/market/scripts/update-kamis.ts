/**
 * src/market/scripts/update-kamis.ts
 *
 * KAMIS API 데이터 수집 + D1 갱신 스크립트
 * GitHub Actions에서 평일 매일 오전 10시(KST)에 자동 실행
 *
 * 사용법:
 *   npx tsx src/market/scripts/update-kamis.ts [--dry-run]
 *
 * 환경변수:
 *   KAMIS_CERT_ID          KAMIS 인증 ID (필수)
 *   KAMIS_CERT_KEY         KAMIS 인증 키 (필수)
 *   CLOUDFLARE_API_TOKEN   wrangler D1 인증 (필수)
 *   CLOUDFLARE_ACCOUNT_ID  Cloudflare 계정 ID (필수)
 *   CLOUDFLARE_D1_DATABASE_ID  D1 DB ID (필수)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import {
  getKamisDailyPrice,
  getKamisMonthlyPrice,
  KAMIS_REGION_CODES,
  KAMIS_ITEM_CODES,
} from '@market/lib/api/kamis-client'

// =====================================================================
// 설정
// =====================================================================

const isDryRun = process.argv.includes('--dry-run')
const DB_NAME = 'apt-trade-db'
const TMP_SQL_FILE = path.join(process.cwd(), '.tmp/update-kamis.sql')
const BATCH_SIZE = 100
const API_CALL_DELAY_MS = 300
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

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
 * market_daily_prices UPSERT SQL 생성
 */
function buildDailyInsert(
  item_cd: string,
  sgg_cd: string,
  ymd: string,
  high: string,
  low: string,
  avg: string
): string {
  return `INSERT INTO market_daily_prices (item_cd, sgg_cd, grd_cd, vrty_cd, ymd, high_price, low_price, avg_price)
VALUES (${esc(item_cd)}, ${esc(sgg_cd)}, '04', '01', ${esc(ymd)}, ${num(high)}, ${num(low)}, ${num(avg)})
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd, ymd) DO UPDATE SET
  avg_price = excluded.avg_price,
  high_price = excluded.high_price,
  low_price = excluded.low_price;`
}

/**
 * market_monthly_prices UPSERT SQL 생성
 */
function buildMonthlyInsert(
  item_cd: string,
  sgg_cd: string,
  ym: string,
  high: string,
  low: string,
  avg: string
): string {
  return `INSERT INTO market_monthly_prices (item_cd, sgg_cd, grd_cd, vrty_cd, ym, high_price, low_price, avg_price)
VALUES (${esc(item_cd)}, ${esc(sgg_cd)}, '04', '01', ${esc(ym)}, ${num(high)}, ${num(low)}, ${num(avg)})
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd, ym) DO UPDATE SET
  avg_price = excluded.avg_price,
  high_price = excluded.high_price,
  low_price = excluded.low_price;`
}

/**
 * market_item_stats UPSERT SQL 생성
 */
function buildStatsUpsert(
  item_cd: string,
  item_nm: string,
  sgg_cd: string,
  sgg_nm: string,
  latest_price: string,
  latest_ymd: string,
  percentile: string,
  cheapness_score: string
): string {
  // 기존 row 조회 후 필요 필드만 갱신
  return `INSERT INTO market_item_stats (
  item_cd, item_nm, ctgry_cd, ctgry_nm, sgg_cd, sgg_nm, se_cd, unit, unit_sz,
  grd_cd, grd_label, vrty_cd, vrty_label, is_default, latest_price, latest_ymd, percentile, cheapness_score, updated_at
) VALUES (
  ${esc(item_cd)}, ${esc(item_nm)}, '', '', ${esc(sgg_cd)}, ${esc(sgg_nm)}, NULL, '', '',
  '04', '', '01', '', 0, ${num(latest_price)}, ${esc(latest_ymd)}, ${num(percentile)}, ${num(cheapness_score)}, datetime('now')
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
  console.log(`
🚀 KAMIS API 데이터 수집 + D1 갱신 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  지역: ${KAMIS_REGION_CODES.length}개
  품목: ${KAMIS_ITEM_CODES.length}개
  총 호출: ${KAMIS_REGION_CODES.length * KAMIS_ITEM_CODES.length}회
  예상 시간: ~${Math.ceil((KAMIS_REGION_CODES.length * KAMIS_ITEM_CODES.length * API_CALL_DELAY_MS) / 1000 / 60)}분
${isDryRun ? '  [dry-run] 실제 실행하지 않음' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)

  const dailyInserts: string[] = []
  const monthlyInserts: string[] = []
  const statsUpserts: string[] = []

  let successCount = 0
  let failureCount = 0

  // 1. 일일 + 월별 데이터 수집
  console.log('📊 KAMIS API에서 데이터 수집 중...')
  let current = 0
  const total = KAMIS_REGION_CODES.length * KAMIS_ITEM_CODES.length

  for (const sgg_cd of KAMIS_REGION_CODES) {
    for (const item_cd of KAMIS_ITEM_CODES) {
      current++

      try {
        // 일일 가격
        const dailyPrice = await getKamisDailyPrice(item_cd, sgg_cd)
        if (dailyPrice) {
          const ymd = dailyPrice.regday
          const avg = dailyPrice.price
          dailyInserts.push(buildDailyInsert(item_cd, sgg_cd, ymd, '', '', avg))
          successCount++
        }
      } catch (e) {
        failureCount++
        console.warn(`  ⚠ ${item_cd}/${sgg_cd} 일일 조회 실패`)
      }

      // Rate limiting
      if (current % 50 === 0) {
        console.log(`  진행: ${current}/${total}`)
      }

      await sleep(API_CALL_DELAY_MS)
    }
  }

  console.log(`✅ 일일 데이터 수집 완료: ${successCount}개, 실패: ${failureCount}개`)

  // 월별 데이터 수집 (최근 12개월)
  console.log('📈 월별 데이터 수집 중...')
  const now = new Date()
  const endYyyy = String(now.getFullYear())
  const startYyyy = String(now.getFullYear() - 1)

  successCount = 0
  failureCount = 0
  current = 0

  for (const sgg_cd of KAMIS_REGION_CODES) {
    for (const item_cd of KAMIS_ITEM_CODES) {
      current++

      try {
        const monthlyPrices = await getKamisMonthlyPrice(item_cd, sgg_cd, startYyyy, endYyyy)
        for (const mp of monthlyPrices) {
          const ym = `${mp.yyyy}${mp.mm}`
          monthlyInserts.push(
            buildMonthlyInsert(item_cd, sgg_cd, ym, mp.high_price, mp.low_price, mp.avg_price)
          )
        }
        successCount++
      } catch (e) {
        failureCount++
        console.warn(`  ⚠ ${item_cd}/${sgg_cd} 월별 조회 실패`)
      }

      if (current % 50 === 0) {
        console.log(`  진행: ${current}/${total}`)
      }

      await sleep(API_CALL_DELAY_MS)
    }
  }

  console.log(`✅ 월별 데이터 수집 완료: ${successCount}개, 실패: ${failureCount}개`)

  // 2. D1에 일일 + 월별 데이터 UPSERT
  console.log('\n💾 D1에 데이터 적재 중...')

  if (dailyInserts.length > 0) {
    const sql = ['BEGIN TRANSACTION;', ...dailyInserts, 'COMMIT;'].join('\n')
    await runSQL(sql, `일일 데이터 UPSERT (${dailyInserts.length}개)`)
  }

  if (monthlyInserts.length > 0) {
    const sql = ['BEGIN TRANSACTION;', ...monthlyInserts, 'COMMIT;'].join('\n')
    await runSQL(sql, `월별 데이터 UPSERT (${monthlyInserts.length}개)`)
  }

  // 3. Percentile 및 Cheapness Score 재계산
  // ⚠️ 이 부분은 현재 간략화됨 (실제 구현시 별도 함수 필요)
  console.log('\n📊 Percentile/Cheapness Score 재계산 (향후 구현)')

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ KAMIS API 데이터 수집 + D1 갱신 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - 일일 데이터: ${dailyInserts.length}개
  - 월별 데이터: ${monthlyInserts.length}개
  - SQL 파일: ${TMP_SQL_FILE}
  `)
}

main().catch((err) => {
  console.error('❌ 오류:', err.message)
  process.exit(1)
})
