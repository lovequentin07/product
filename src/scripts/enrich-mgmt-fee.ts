/**
 * src/scripts/enrich-mgmt-fee.ts
 * D1의 mgmt_fee 테이블에 세대수(household_cnt)와 세대당 관리비(per_hh) 컬럼 보강
 *
 * 사용법:
 *   npx tsx src/scripts/enrich-mgmt-fee.ts
 *
 * 동작:
 *   1. D1에서 household_cnt IS NULL인 distinct kapt_code 조회
 *   2. 각 단지별 getAphusBassInfoV4 API 호출 → kaptdaCnt(세대수) 추출
 *   3. per_hh 컬럼 계산 후 D1 UPDATE
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// -------------------------
// 설정
// -------------------------
const DB_NAME = 'apt-trade-db';
const TMP_SQL_FILE = '/tmp/enrich_batch.sql';
const BATCH_SIZE = 100;
const PROGRESS_FILE = '/tmp/enrich_mgmt_fee_progress.json';
const API_BASE = 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4';
const DELAY_MS = 200; // API 레이트 리밋 대비

// -------------------------
// 유틸
// -------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface Progress {
  done: string[];
  failed: string[];
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { done: [], failed: [] };
}

function saveProgress(p: Progress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), 'utf-8');
}

// -------------------------
// API 호출
// -------------------------
interface AptBassInfo {
  kaptdaCnt?: number | string;  // 세대수
  kaptName?: string;
}

async function fetchAptBassInfo(kaptCode: string): Promise<AptBassInfo | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) throw new Error('DATA_GO_KR_API_KEY not set');

  const params = new URLSearchParams({
    serviceKey: apiKey,
    kaptCode,
    _type: 'json',
  });
  const url = `${API_BASE}?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json() as {
    response?: { body?: { item?: AptBassInfo | AptBassInfo[] } };
  };

  const item = json?.response?.body?.item;
  if (!item) return null;

  return Array.isArray(item) ? item[0] : item;
}

// -------------------------
// D1 쿼리: 미처리 단지 조회
// -------------------------
function getUnprocessedCodes(): string[] {
  const result = execSync(
    `npx wrangler d1 execute ${DB_NAME} --command "SELECT DISTINCT kapt_code FROM mgmt_fee WHERE household_cnt IS NULL ORDER BY kapt_code" --remote --json`,
    { encoding: 'utf-8' }
  );
  const parsed = JSON.parse(result);
  const rows: { kapt_code: string }[] = parsed[0]?.results ?? [];
  return rows.map((r) => r.kapt_code);
}

// -------------------------
// D1 UPDATE 배치 실행
// -------------------------
interface UpdateRow {
  kapt_code: string;
  household_cnt: number;
}

function runUpdateBatch(updates: UpdateRow[]): void {
  if (updates.length === 0) return;

  const stmts = updates.map((u) => {
    const hh = u.household_cnt;
    // per_hh 는 별도 UPDATE로 계산
    return `UPDATE mgmt_fee SET household_cnt = ${hh} WHERE kapt_code = '${u.kapt_code}';`;
  });

  const sql = stmts.join('\n');
  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`, {
    stdio: 'inherit',
  });
}

// -------------------------
// per_hh 계산 UPDATE (전체 한 번)
// -------------------------
function calculatePerHh(): void {
  console.log('\n🔢 세대당 평균(per_hh) 계산 중...');
  const sql = `
UPDATE mgmt_fee
SET
  common_per_hh      = CASE WHEN household_cnt > 0 THEN ROUND(CAST(common_mgmt_total AS REAL) / household_cnt) ELSE NULL END,
  security_per_hh    = CASE WHEN household_cnt > 0 THEN ROUND(CAST(security_cost AS REAL) / household_cnt) ELSE NULL END,
  cleaning_per_hh    = CASE WHEN household_cnt > 0 THEN ROUND(CAST(cleaning_cost AS REAL) / household_cnt) ELSE NULL END,
  heating_per_hh     = CASE WHEN household_cnt > 0 THEN ROUND(CAST(heating_common + heating_indiv AS REAL) / household_cnt) ELSE NULL END,
  electricity_per_hh = CASE WHEN household_cnt > 0 THEN ROUND(CAST(electricity_common + electricity_indiv AS REAL) / household_cnt) ELSE NULL END,
  water_per_hh       = CASE WHEN household_cnt > 0 THEN ROUND(CAST(water_common + water_indiv AS REAL) / household_cnt) ELSE NULL END,
  ltm_per_hh         = CASE WHEN household_cnt > 0 THEN ROUND(CAST(ltm_monthly_charge AS REAL) / household_cnt) ELSE NULL END,
  total_per_hh       = CASE WHEN household_cnt > 0 THEN ROUND(CAST(common_mgmt_total + indiv_usage_total + ltm_monthly_charge AS REAL) / household_cnt) ELSE NULL END
WHERE household_cnt IS NOT NULL AND household_cnt > 0;
  `.trim();

  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`, {
    stdio: 'inherit',
  });
  console.log('✅ per_hh 계산 완료');
}

// -------------------------
// 메인
// -------------------------
async function main() {
  console.log('🔍 D1에서 미처리 단지 조회 중...');
  const allCodes = getUnprocessedCodes();
  console.log(`📊 미처리 단지: ${allCodes.length}개`);

  if (allCodes.length === 0) {
    console.log('✅ 모든 단지 처리 완료. per_hh 계산으로 진행합니다.');
    calculatePerHh();
    return;
  }

  const progress = loadProgress();
  const doneSet = new Set(progress.done);
  const pendingCodes = allCodes.filter((c) => !doneSet.has(c));
  console.log(`📌 처리할 단지: ${pendingCodes.length}개 (이미 완료: ${doneSet.size}개)`);

  let updateBatch: UpdateRow[] = [];
  let processed = 0;

  for (const kaptCode of pendingCodes) {
    try {
      const info = await fetchAptBassInfo(kaptCode);
      const hh = info?.kaptdaCnt ? parseInt(String(info.kaptdaCnt), 10) : 0;

      if (hh > 0) {
        updateBatch.push({ kapt_code: kaptCode, household_cnt: hh });
      } else {
        // 세대수 0이면 1로 설정 (0나누기 방지), 데이터 품질 이슈
        updateBatch.push({ kapt_code: kaptCode, household_cnt: 1 });
      }

      progress.done.push(kaptCode);
      processed++;

      if (updateBatch.length >= BATCH_SIZE) {
        process.stdout.write(`\r  UPDATE 중... ${processed}/${pendingCodes.length}`);
        runUpdateBatch(updateBatch);
        updateBatch = [];
        saveProgress(progress);
      }

      await sleep(DELAY_MS);
    } catch (err) {
      console.warn(`\n⚠️  ${kaptCode} API 오류:`, (err as Error).message);
      progress.failed.push(kaptCode);
    }
  }

  // 남은 배치
  if (updateBatch.length > 0) {
    runUpdateBatch(updateBatch);
    saveProgress(progress);
  }

  console.log(`\n✅ API 보강 완료: ${processed}건`);
  if (progress.failed.length > 0) {
    console.warn(`⚠️  실패: ${progress.failed.length}건 (${PROGRESS_FILE} 참조)`);
  }

  // per_hh 계산
  calculatePerHh();
}

main().catch((err) => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
