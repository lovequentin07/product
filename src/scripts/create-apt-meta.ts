/**
 * src/scripts/create-apt-meta.ts
 * K-apt 단지 기본정보 → apt_meta 마스터 테이블 생성 + per_hh 계산
 *
 * 전제조건:
 *   - raw-data/kapt-info/*.json  (fetch-kapt-info.ts 실행 결과)
 *   - apt_mgmt_fee 테이블에 데이터 적재 완료 (migrate-mgmt-fee.ts 실행 결과)
 *
 * 단계:
 *   1단계: kapt-info JSON → apt_meta 배치 INSERT (kapt_code, household_cnt 등)
 *   2단계: per_hh 계산 (apt_meta.household_cnt → apt_mgmt_fee per_hh 컬럼)
 *
 * 사용법:
 *   npx tsx src/scripts/create-apt-meta.ts            # 로컬 D1
 *   npx tsx src/scripts/create-apt-meta.ts --remote   # 프로덕션 D1
 *
 * 재실행 안전: INSERT OR IGNORE / UPDATE WHERE IS NULL
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// -------------------------
// 설정
// -------------------------
const DB_NAME = 'apt-trade-db';
const TMP_SQL = '/tmp/create_apt_meta.sql';
const KAPT_INFO_DIR = path.join(process.cwd(), 'raw-data/kapt-info');
const BATCH_SIZE = 500;
const isRemote = process.argv.includes('--remote');
const remoteFlag = isRemote ? '--remote' : '--local';

// -------------------------
// 타입
// -------------------------
interface KaptInfoFile {
  kaptCode?: string;
  kaptName?: string;
  bjdCode?: string;
  as2?: string;          // 시군구명
  as3?: string;          // 동명 (주로 사용)
  as4?: string;          // 동명 fallback
  umd_nm?: string;       // fetch-kapt-info.ts가 저장한 동명
  kaptdaCnt?: string | number;
  kaptDongCnt?: string | number;
  kaptUsedate?: string;  // YYYYMMDD
}

// -------------------------
// 유틸
// -------------------------
function normalize(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

function usedateToDate(yyyymmdd: string | undefined): string | null {
  if (!yyyymmdd || yyyymmdd.length < 8) return null;
  return `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`;
}

function escapeSql(val: string): string {
  return val.replace(/'/g, "''");
}

function runSql(sql: string, label: string): void {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  console.log(`\n[${label}] 실행 중...`);
  try {
    const out = execSync(
      `wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${TMP_SQL}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    console.log(`[${label}] 완료`);
    if (out?.trim()) console.log(out.trim());
  } catch (e: unknown) {
    const err = e as { stderr?: string; stdout?: string; message?: string };
    console.error(`[${label}] 실패:`, err.stderr ?? err.stdout ?? err.message);
    throw e;
  }
}

function queryRows<T>(sql: string): T[] {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  try {
    const out = execSync(
      `wrangler d1 execute ${DB_NAME} ${remoteFlag} --file=${TMP_SQL} --json`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const parsed = JSON.parse(out);
    return parsed?.[0]?.results ?? [];
  } catch {
    return [];
  }
}

// -------------------------
// 단계 1: kapt-info JSON → apt_meta INSERT
// -------------------------
function step1_insertAptMeta(): void {
  console.log('\n[단계1] kapt-info JSON → apt_meta INSERT...');

  const files = fs.readdirSync(KAPT_INFO_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('sample_'));

  console.log(`  → ${files.length}개 파일 처리`);

  const INSERT_COLS = `(kapt_code, sgg_cd, sgg_nm, umd_nm, umd_cd,
    apt_nm, build_year, completion_date, household_cnt, building_cnt)`;

  let batch: string[] = [];
  let total = 0;
  let skipped = 0;

  const flush = (label: string) => {
    if (batch.length === 0) return;
    const sql = `INSERT OR IGNORE INTO apt_meta ${INSERT_COLS} VALUES\n${batch.join(',\n')};`;
    runSql(sql, label);
    batch = [];
  };

  for (const file of files) {
    let info: KaptInfoFile;
    try {
      info = JSON.parse(fs.readFileSync(path.join(KAPT_INFO_DIR, file), 'utf8'));
    } catch { skipped++; continue; }

    const kaptCode = info.kaptCode?.trim();
    const kaptName = info.kaptName?.trim();
    const bjdCode  = info.bjdCode?.trim();

    if (!kaptCode || !kaptName || !bjdCode || bjdCode.length < 10) {
      skipped++;
      continue;
    }

    const sgg_cd   = bjdCode.substring(0, 5);
    const umd_cd   = bjdCode.substring(5, 10);
    const sgg_nm   = info.as2?.trim() ?? '';
    const umd_nm   = (info.umd_nm ?? info.as3 ?? info.as4)?.trim() ?? '';
    const apt_nm   = normalize(kaptName);
    const hh       = Math.max(parseInt(String(info.kaptdaCnt  ?? '0'), 10) || 0, 0);
    const bldg     = Math.max(parseInt(String(info.kaptDongCnt ?? '0'), 10) || 0, 0);
    const compDate = usedateToDate(info.kaptUsedate);
    const buildYr  = info.kaptUsedate ? parseInt(info.kaptUsedate.substring(0, 4)) : null;

    const cd = compDate ? `'${compDate}'` : 'NULL';
    const by = buildYr  ? String(buildYr) : 'NULL';

    batch.push(
      `('${escapeSql(kaptCode)}','${escapeSql(sgg_cd)}','${escapeSql(sgg_nm)}',` +
      `'${escapeSql(umd_nm)}','${escapeSql(umd_cd)}','${escapeSql(apt_nm)}',` +
      `${by},${cd},${hh},${bldg})`
    );
    total++;

    if (batch.length >= BATCH_SIZE) {
      flush(`단계1 배치 (${total}번째)`);
    }
  }
  flush(`단계1 최종 배치`);

  const rows = queryRows<{ cnt: number }>('SELECT COUNT(*) as cnt FROM apt_meta;');
  console.log(`  → apt_meta 총 ${rows[0]?.cnt ?? '?'}건 (skip: ${skipped})`);
}

// -------------------------
// 단계 2: per_hh 계산
// apt_mgmt_fee.kapt_code = apt_meta.kapt_code JOIN으로 household_cnt 참조
// -------------------------
function step2_perHh(): void {
  // household_cnt를 apt_meta에서 apt_mgmt_fee로 전파
  runSql(`
UPDATE apt_mgmt_fee
SET household_cnt = (
  SELECT m.household_cnt FROM apt_meta m
  WHERE m.kapt_code = apt_mgmt_fee.kapt_code AND m.household_cnt > 0
)
WHERE household_cnt IS NULL;
  `, '단계2a household_cnt 전파');

  // per_hh 8개 컬럼 계산
  runSql(`
UPDATE apt_mgmt_fee SET
  common_per_hh      = CASE WHEN household_cnt > 0 THEN ROUND(CAST(common_mgmt_total AS REAL) / household_cnt) ELSE NULL END,
  security_per_hh    = CASE WHEN household_cnt > 0 THEN ROUND(CAST(security_cost AS REAL) / household_cnt) ELSE NULL END,
  cleaning_per_hh    = CASE WHEN household_cnt > 0 THEN ROUND(CAST(cleaning_cost AS REAL) / household_cnt) ELSE NULL END,
  heating_per_hh     = CASE WHEN household_cnt > 0 THEN ROUND(CAST((heating_common + heating_indiv) AS REAL) / household_cnt) ELSE NULL END,
  electricity_per_hh = CASE WHEN household_cnt > 0 THEN ROUND(CAST((electricity_common + electricity_indiv) AS REAL) / household_cnt) ELSE NULL END,
  water_per_hh       = CASE WHEN household_cnt > 0 THEN ROUND(CAST((water_common + water_indiv) AS REAL) / household_cnt) ELSE NULL END,
  ltm_per_hh         = CASE WHEN household_cnt > 0 THEN ROUND(CAST(ltm_monthly_charge AS REAL) / household_cnt) ELSE NULL END,
  total_per_hh       = CASE WHEN household_cnt > 0 THEN ROUND(CAST((common_mgmt_total + indiv_usage_total + ltm_monthly_charge) AS REAL) / household_cnt) ELSE NULL END
WHERE household_cnt IS NOT NULL AND household_cnt > 0;
  `, '단계2b per_hh 계산');

  const r = queryRows<{ total: number; with_per_hh: number }>(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN common_per_hh IS NOT NULL THEN 1 ELSE 0 END) AS with_per_hh
    FROM apt_mgmt_fee;`)[0];
  if (r) {
    const pct = ((r.with_per_hh / r.total) * 100).toFixed(1);
    console.log(`  → per_hh 계산: ${r.with_per_hh}/${r.total} (${pct}%)`);
  }
}

// -------------------------
// 메인
// -------------------------
async function main(): Promise<void> {
  console.log(`\n=== apt_meta 생성 (${isRemote ? 'REMOTE' : 'LOCAL'}) ===`);

  const kaptFiles = fs.existsSync(KAPT_INFO_DIR)
    ? fs.readdirSync(KAPT_INFO_DIR).filter(f => f.endsWith('.json') && !f.startsWith('sample_'))
    : [];
  if (kaptFiles.length === 0) {
    console.error('❌ raw-data/kapt-info/*.json 없음 → fetch-kapt-info.ts 먼저 실행하세요.');
    process.exit(1);
  }
  console.log(`  kapt-info 파일: ${kaptFiles.length}개`);

  try {
    step1_insertAptMeta();
    step2_perHh();
    console.log('\n=== 완료 ===\n');
  } finally {
    if (fs.existsSync(TMP_SQL)) fs.unlinkSync(TMP_SQL);
  }
}

main().catch(e => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
