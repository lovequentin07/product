/**
 * src/scripts/create-apt-meta.ts
 * apt_meta 마스터 테이블 생성 및 backfill 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx src/scripts/create-apt-meta.ts            # 로컬 D1 (local 환경)
 *   npx tsx src/scripts/create-apt-meta.ts --remote   # 프로덕션 D1
 *
 * 4단계 실행:
 *   1단계: apt_transactions → apt_meta 추출 + apt_name_alias 생성
 *   2단계: apt_mgmt_fee → apt_meta UPSERT (kapt_code 매핑)
 *   3단계: apt_meta_id backfill (apt_transactions, apt_mgmt_fee)
 *   4단계: K-apt API → household_cnt 조회 + per_hh 계산 (enrich 통합)
 *
 * 재실행 안전: INSERT OR IGNORE / UPDATE ... WHERE IS NULL 사용
 * 환경변수: DATA_GO_KR_API_KEY (단계4 필수)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import { getAptBassInfo } from '../lib/api/apartment';

// -------------------------
// 설정
// -------------------------
const DB_NAME = 'apt-trade-db';
const TMP_SQL = '/tmp/create_apt_meta.sql';
const isRemote = process.argv.includes('--remote');
const remoteFlag = isRemote ? '--remote' : '--local';
const DELAY_MS = 200;
const PROGRESS_FILE = '/tmp/create_apt_meta_enrich_progress.json';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// -------------------------
// 유틸
// -------------------------
function runSql(sql: string, label: string): void {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  console.log(`\n[${label}] 실행 중...`);
  try {
    const out = execSync(
      `wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${TMP_SQL}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    console.log(`[${label}] 완료`);
    if (out) console.log(out.trim());
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string; message?: string };
    console.error(`[${label}] 실패:`, err.stderr ?? err.stdout ?? err.message);
    throw e;
  }
}

function queryOne(sql: string): string {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  try {
    return execSync(
      `wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${TMP_SQL} --json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch {
    return '[]';
  }
}

// -------------------------
// 단계 0: 새 테이블 + 컬럼 준비
// -------------------------
function step0_setup(): void {
  // apt_transactions.apt_meta_id 컬럼이 없으면 추가
  const alterTxn = `
ALTER TABLE apt_transactions ADD COLUMN apt_meta_id INTEGER REFERENCES apt_meta(id);
`;
  const alterFee = `
ALTER TABLE apt_mgmt_fee ADD COLUMN apt_meta_id INTEGER REFERENCES apt_meta(id);
`;
  const createIndex = `
CREATE INDEX IF NOT EXISTS idx_apt_txn_meta  ON apt_transactions(apt_meta_id);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_meta ON apt_mgmt_fee(apt_meta_id);
`;

  // 컬럼이 이미 존재하면 ALTER는 에러를 내지만 무시해도 됨
  for (const sql of [alterTxn, alterFee]) {
    try {
      fs.writeFileSync(TMP_SQL, sql, 'utf8');
      execSync(`wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${TMP_SQL}`, {
        encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch {
      // 이미 컬럼 존재 → 무시
    }
  }
  runSql(createIndex, '단계0 인덱스');
}

// -------------------------
// 단계 1: apt_transactions → apt_meta 추출
// -------------------------
function step1_from_transactions(): void {
  // 1a: apt_meta에 단지 삽입 (DISTINCT sgg_cd, umd_nm, apt_nm 기준)
  // apt_seq는 동일 단지에 여러 값이 있을 수 있어 MIN으로 대표값 선택
  const insertMeta = `
INSERT OR IGNORE INTO apt_meta
  (sgg_cd, sgg_nm, umd_nm, umd_cd, road_nm, jibun, bonbun, bubun, apt_nm, build_year, apt_seq)
SELECT
  sgg_cd,
  MIN(sgg_nm)                          AS sgg_nm,
  umd_nm,
  MIN(umd_cd)                          AS umd_cd,
  MIN(road_nm)                         AS road_nm,
  MIN(jibun)                           AS jibun,
  MIN(bonbun)                          AS bonbun,
  MIN(bubun)                           AS bubun,
  REPLACE(apt_nm, ' ', '')             AS apt_nm,
  MIN(build_year)                      AS build_year,
  MIN(apt_seq)                         AS apt_seq
FROM apt_transactions
WHERE apt_nm IS NOT NULL AND apt_nm != '' AND sgg_cd IS NOT NULL
GROUP BY sgg_cd, umd_nm, REPLACE(apt_nm, ' ', '');
`;

  // 1b: apt_name_alias — 원본 표기 매핑 (공백 포함 원문 그대로)
  const insertAlias = `
INSERT OR IGNORE INTO apt_name_alias
  (apt_meta_id, source, raw_apt_nm, raw_sgg_nm, raw_umd_nm)
SELECT DISTINCT
  m.id,
  'transactions'                       AS source,
  t.apt_nm                             AS raw_apt_nm,
  t.sgg_nm                             AS raw_sgg_nm,
  t.umd_nm                             AS raw_umd_nm
FROM apt_transactions t
JOIN apt_meta m
  ON m.sgg_cd = t.sgg_cd
  AND m.umd_nm = t.umd_nm
  AND m.apt_nm = REPLACE(t.apt_nm, ' ', '')
WHERE t.apt_nm IS NOT NULL AND t.apt_nm != '';
`;

  runSql(insertMeta, '단계1a apt_meta 삽입');
  runSql(insertAlias, '단계1b alias 생성');

  // 통계 출력
  const countJson = queryOne('SELECT COUNT(*) as cnt FROM apt_meta;');
  try {
    const rows = JSON.parse(countJson);
    const cnt = rows?.[0]?.results?.[0]?.cnt ?? '?';
    console.log(`  → apt_meta 총 ${cnt}건`);
  } catch { /* 무시 */ }
}

// -------------------------
// 단계 2: apt_mgmt_fee → apt_meta UPSERT
// -------------------------
function step2_from_mgmt_fee(): void {
  // sgg_nm → sgg_cd 변환 테이블 (서울 25개 구)
  // 2a: 매칭되는 apt_meta가 있으면 kapt_code / household_cnt만 UPDATE
  const updateExisting = `
UPDATE apt_meta
SET
  kapt_code     = (
    SELECT f.kapt_code
    FROM apt_mgmt_fee f
    WHERE f.sgg_nm = apt_meta.sgg_nm
      AND f.umd_nm = apt_meta.umd_nm
      AND REPLACE(f.apt_nm, ' ', '') = apt_meta.apt_nm
    ORDER BY f.billing_ym DESC
    LIMIT 1
  ),
  household_cnt = COALESCE(
    apt_meta.household_cnt,
    (
      SELECT f.household_cnt
      FROM apt_mgmt_fee f
      WHERE f.sgg_nm = apt_meta.sgg_nm
        AND f.umd_nm = apt_meta.umd_nm
        AND REPLACE(f.apt_nm, ' ', '') = apt_meta.apt_nm
        AND f.household_cnt IS NOT NULL
      ORDER BY f.billing_ym DESC
      LIMIT 1
    )
  ),
  updated_at    = CURRENT_TIMESTAMP
WHERE EXISTS (
  SELECT 1
  FROM apt_mgmt_fee f
  WHERE f.sgg_nm = apt_meta.sgg_nm
    AND f.umd_nm = apt_meta.umd_nm
    AND REPLACE(f.apt_nm, ' ', '') = apt_meta.apt_nm
);
`;

  // 2b: apt_name_alias — 관리비 원문 표기 매핑
  const insertAlias = `
INSERT OR IGNORE INTO apt_name_alias
  (apt_meta_id, source, raw_apt_nm, raw_sgg_nm, raw_umd_nm)
SELECT DISTINCT
  m.id,
  'mgmt_fee'                           AS source,
  f.apt_nm                             AS raw_apt_nm,
  f.sgg_nm                             AS raw_sgg_nm,
  f.umd_nm                             AS raw_umd_nm
FROM apt_mgmt_fee f
JOIN apt_meta m
  ON m.sgg_nm = f.sgg_nm
  AND m.umd_nm = f.umd_nm
  AND m.apt_nm = REPLACE(f.apt_nm, ' ', '')
WHERE f.apt_nm IS NOT NULL AND f.apt_nm != '';
`;

  runSql(updateExisting, '단계2a kapt_code/household 업데이트');
  runSql(insertAlias, '단계2b mgmt alias 생성');

  // kapt_code 채워진 비율 출력
  const countJson = queryOne(
    "SELECT COUNT(*) as matched FROM apt_meta WHERE kapt_code IS NOT NULL;"
  );
  try {
    const rows = JSON.parse(countJson);
    const matched = rows?.[0]?.results?.[0]?.matched ?? '?';
    console.log(`  → kapt_code 매칭된 단지: ${matched}건`);
  } catch { /* 무시 */ }
}

// -------------------------
// 단계 3: apt_meta_id backfill
// -------------------------
function step3_backfill(): void {
  // 3a: apt_transactions — alias를 통해 apt_meta_id 설정
  const backfillTxn = `
UPDATE apt_transactions
SET apt_meta_id = (
  SELECT a.apt_meta_id
  FROM apt_name_alias a
  WHERE a.source = 'transactions'
    AND a.raw_apt_nm = apt_transactions.apt_nm
    AND (a.raw_sgg_nm = apt_transactions.sgg_nm OR a.raw_sgg_nm IS NULL)
    AND (a.raw_umd_nm = apt_transactions.umd_nm OR a.raw_umd_nm IS NULL)
  LIMIT 1
)
WHERE apt_meta_id IS NULL;
`;

  // 3b: apt_mgmt_fee — kapt_code 직접 매칭
  const backfillFee = `
UPDATE apt_mgmt_fee
SET apt_meta_id = (
  SELECT id FROM apt_meta WHERE kapt_code = apt_mgmt_fee.kapt_code LIMIT 1
)
WHERE apt_meta_id IS NULL;
`;

  runSql(backfillTxn, '단계3a transactions backfill');
  runSql(backfillFee, '단계3b mgmt_fee backfill');

  // 결과 통계
  const txnJson = queryOne(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN apt_meta_id IS NOT NULL THEN 1 ELSE 0 END) AS filled
    FROM apt_transactions;
  `);
  const feeJson = queryOne(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN apt_meta_id IS NOT NULL THEN 1 ELSE 0 END) AS filled
    FROM apt_mgmt_fee;
  `);

  try {
    const txnRows = JSON.parse(txnJson);
    const r = txnRows?.[0]?.results?.[0];
    if (r) {
      const pct = ((r.filled / r.total) * 100).toFixed(1);
      console.log(`  → apt_transactions backfill: ${r.filled}/${r.total} (${pct}%)`);
    }
  } catch { /* 무시 */ }

  try {
    const feeRows = JSON.parse(feeJson);
    const r = feeRows?.[0]?.results?.[0];
    if (r) {
      const pct = ((r.filled / r.total) * 100).toFixed(1);
      console.log(`  → apt_mgmt_fee backfill: ${r.filled}/${r.total} (${pct}%)`);
    }
  } catch { /* 무시 */ }
}

// -------------------------
// 단계 4: K-apt API → household_cnt + per_hh 계산
// -------------------------
async function step4_enrich_household(): Promise<void> {
  console.log('\n[단계4] 세대수 API 조회 + per_hh 계산...');

  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.warn('  ⚠️  DATA_GO_KR_API_KEY 미설정 → 단계4 건너뜀');
    return;
  }

  // 진행상황 복원 (재실행 안전)
  let processed: Set<string> = new Set();
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) as { processed: string[] };
      processed = new Set(saved.processed);
      console.log(`  → 진행상황 복원: ${processed.size}건 이미 처리됨`);
    } catch { /* 무시 */ }
  }

  // 4a: kapt_code IS NOT NULL이고 household_cnt가 없는 apt_meta 조회
  const rowsJson = queryOne(`
    SELECT id, kapt_code FROM apt_meta
    WHERE kapt_code IS NOT NULL AND household_cnt IS NULL
    ORDER BY id;
  `);

  let rows: { id: number; kapt_code: string }[] = [];
  try {
    const parsed = JSON.parse(rowsJson);
    rows = parsed?.[0]?.results ?? [];
  } catch { /* 무시 */ }

  console.log(`  → 세대수 조회 대상: ${rows.length}건`);

  let done = 0;
  let failed = 0;

  for (const row of rows) {
    if (processed.has(row.kapt_code)) continue;

    const info = await getAptBassInfo(row.kapt_code);
    const raw = info?.kaptdaCnt;
    const cnt = Math.max(parseInt(String(raw ?? '0'), 10) || 0, 1);

    const updateSql = `UPDATE apt_meta SET household_cnt = ${cnt}, updated_at = CURRENT_TIMESTAMP WHERE id = ${row.id};`;
    try {
      fs.writeFileSync(TMP_SQL, updateSql, 'utf8');
      execSync(`wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${TMP_SQL}`, {
        encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
      });
      processed.add(row.kapt_code);
      done++;
    } catch {
      failed++;
    }

    // 10건마다 진행상황 저장
    if ((done + failed) % 10 === 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processed: [...processed] }), 'utf8');
      process.stdout.write(`\r  → ${done}/${rows.length} 처리됨, ${failed}건 실패`);
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processed: [...processed] }), 'utf8');
  console.log(`\n  → 단계4a 완료: ${done}건 성공, ${failed}건 실패`);

  // 4b: apt_meta.household_cnt → apt_mgmt_fee.household_cnt 전파
  runSql(`
UPDATE apt_mgmt_fee
SET household_cnt = (
  SELECT m.household_cnt FROM apt_meta m
  WHERE m.kapt_code = apt_mgmt_fee.kapt_code
    AND m.household_cnt IS NOT NULL
)
WHERE household_cnt IS NULL;
  `, '단계4b apt_mgmt_fee 세대수 전파');

  // 4c: per_hh 컬럼 계산
  runSql(`
UPDATE apt_mgmt_fee
SET
  common_per_hh      = CASE WHEN household_cnt > 0 THEN ROUND(CAST(common_mgmt_total AS REAL) / household_cnt) ELSE NULL END,
  security_per_hh    = CASE WHEN household_cnt > 0 THEN ROUND(CAST(security_cost AS REAL) / household_cnt) ELSE NULL END,
  cleaning_per_hh    = CASE WHEN household_cnt > 0 THEN ROUND(CAST(cleaning_cost AS REAL) / household_cnt) ELSE NULL END,
  heating_per_hh     = CASE WHEN household_cnt > 0 THEN ROUND(CAST((heating_common + heating_indiv) AS REAL) / household_cnt) ELSE NULL END,
  electricity_per_hh = CASE WHEN household_cnt > 0 THEN ROUND(CAST((electricity_common + electricity_indiv) AS REAL) / household_cnt) ELSE NULL END,
  water_per_hh       = CASE WHEN household_cnt > 0 THEN ROUND(CAST((water_common + water_indiv) AS REAL) / household_cnt) ELSE NULL END,
  ltm_per_hh         = CASE WHEN household_cnt > 0 THEN ROUND(CAST(ltm_monthly_charge AS REAL) / household_cnt) ELSE NULL END,
  total_per_hh       = CASE WHEN household_cnt > 0 THEN ROUND(CAST((common_mgmt_total + indiv_usage_total + ltm_monthly_charge) AS REAL) / household_cnt) ELSE NULL END
WHERE household_cnt IS NOT NULL AND household_cnt > 0;
  `, '단계4c per_hh 계산');

  // 통계 출력
  const statsJson = queryOne(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN common_per_hh IS NOT NULL THEN 1 ELSE 0 END) AS with_per_hh
    FROM apt_mgmt_fee;
  `);
  try {
    const statsRows = JSON.parse(statsJson);
    const r = statsRows?.[0]?.results?.[0];
    if (r) {
      const pct = ((r.with_per_hh / r.total) * 100).toFixed(1);
      console.log(`  → per_hh 계산 완료: ${r.with_per_hh}/${r.total} (${pct}%)`);
    }
  } catch { /* 무시 */ }

  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
}

// -------------------------
// 메인
// -------------------------
async function main(): Promise<void> {
  console.log(`\n=== apt_meta 마이그레이션 시작 (${isRemote ? 'REMOTE' : 'LOCAL'}) ===`);
  console.log(`대상 DB: ${DB_NAME}\n`);

  try {
    step0_setup();
    step1_from_transactions();
    step2_from_mgmt_fee();
    step3_backfill();
    await step4_enrich_household();
    console.log('\n=== 마이그레이션 완료 ===\n');
  } finally {
    if (fs.existsSync(TMP_SQL)) fs.unlinkSync(TMP_SQL);
  }
}

main().catch((e) => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
