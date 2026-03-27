/**
 * market-stats-by-region.json → D1 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx src/market/scripts/migrate-json-to-d1.ts
 *
 * 실행 후:
 * 1. market_monthly_prices: JSON의 monthly 배열 → 각 행으로 INSERT
 * 2. market_item_stats: JSON의 combo 통계 → UPSERT
 *
 * ⚠️ market_daily_prices는 이 스크립트에서 생성하지 않음.
 *    update-kamis.ts에서 KAMIS API 수집 시 일별 데이터 INSERT.
 */

import fs from 'fs'
import path from 'path'

interface MonthlyPoint {
  ym: string
  high: number | null
  low: number | null
  avg: number | null
}

interface ComboStats {
  vrty_cd: string
  vrty_label: string
  grd_cd: string
  grd_label: string
  is_default: boolean
  monthly: MonthlyPoint[]
  latest_price: number
  latest_ym: string
  percentile: number
  cheapness_score: number
}

interface RegionStat {
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  sgg_cd: string
  sgg_nm: string
  se_cd: string
  unit: string
  unit_sz: string
  combos: ComboStats[]
}

async function main() {
  const jsonPath = path.join(process.cwd(), 'src/market/data/market-stats-by-region.json')

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON 파일을 찾을 수 없습니다: ${jsonPath}`)
    process.exit(1)
  }

  const data: RegionStat[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`📊 JSON 데이터 로드 완료: ${data.length} 개 지역 × 품목`)

  // SQL 문 생성
  const monthlyInserts: string[] = []
  const statsInserts: string[] = []

  for (const region of data) {
    for (const combo of region.combos) {
      // 월별 데이터 INSERT
      for (const monthly of combo.monthly) {
        if (monthly.avg !== null) {
          const monthlyInsert = `INSERT INTO market_monthly_prices (item_cd, sgg_cd, grd_cd, vrty_cd, ym, high_price, low_price, avg_price)
VALUES ('${region.item_cd}', '${region.sgg_cd}', '${combo.grd_cd}', '${combo.vrty_cd}', '${monthly.ym}', ${monthly.high ?? 'NULL'}, ${monthly.low ?? 'NULL'}, ${monthly.avg});`
          monthlyInserts.push(monthlyInsert)
        }
      }

      // 사전계산 통계 UPSERT
      const statsUpsert = `INSERT INTO market_item_stats (
  item_cd, item_nm, ctgry_cd, ctgry_nm, sgg_cd, sgg_nm, se_cd, unit, unit_sz,
  grd_cd, grd_label, vrty_cd, vrty_label, is_default, latest_price, latest_ym, percentile, cheapness_score, updated_at
) VALUES (
  '${region.item_cd}', '${region.item_nm.replace(/'/g, "''")}', '${region.ctgry_cd}', '${region.ctgry_nm}',
  '${region.sgg_cd}', '${region.sgg_nm}', '${region.se_cd}', '${region.unit}', '${region.unit_sz}',
  '${combo.grd_cd}', '${combo.grd_label.replace(/'/g, "''")}', '${combo.vrty_cd}', '${combo.vrty_label.replace(/'/g, "''")}',
  ${combo.is_default ? 1 : 0}, ${combo.latest_price}, '${combo.latest_ym}20', ${combo.percentile}, ${combo.cheapness_score}, datetime('now')
)
ON CONFLICT(item_cd, sgg_cd, grd_cd, vrty_cd) DO UPDATE SET
  latest_price = excluded.latest_price,
  latest_ym = excluded.latest_ym,
  percentile = excluded.percentile,
  cheapness_score = excluded.cheapness_score,
  updated_at = datetime('now');`
      statsInserts.push(statsUpsert)
    }
  }

  console.log(`
📝 생성된 SQL:
  - market_monthly_prices: ${monthlyInserts.length} 행
  - market_item_stats: ${statsInserts.length} 행 (UPSERT)
`)

  // 배치 파일 작성
  const batchPath = path.join(process.cwd(), '.tmp/migrate-market.sql')
  const batchDir = path.dirname(batchPath)

  if (!fs.existsSync(batchDir)) {
    fs.mkdirSync(batchDir, { recursive: true })
  }

  const sqlContent = [
    'BEGIN TRANSACTION;',
    ...monthlyInserts,
    ...statsInserts,
    'COMMIT;'
  ].join('\n')

  fs.writeFileSync(batchPath, sqlContent, 'utf-8')
  console.log(`✅ SQL 배치 파일 생성: ${batchPath}`)

  // 실행 명령어 출력
  console.log(`
🚀 다음 명령어를 실행하세요:

  wrangler d1 execute apt-trade-db --file .tmp/migrate-market.sql --remote
`)
}

main().catch(err => {
  console.error('❌ 오류:', err.message)
  process.exit(1)
})
