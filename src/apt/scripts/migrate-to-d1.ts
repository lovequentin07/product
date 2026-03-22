/**
 * src/scripts/migrate-to-d1.ts
 * JSONL 데이터를 Cloudflare D1으로 적재하는 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx src/scripts/migrate-to-d1.ts
 *
 * 특징:
 *   - 실패한 배치를 3회까지 자동 재시도 (exponential backoff)
 *   - 진행 상황을 /tmp/d1_migrate_progress.json 에 저장 → 중단 후 재개 가능
 *   - 이미 완료된 파일은 건너뜀 (재실행 안전)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

// -------------------------
// 설정
// -------------------------
const RAW_DATA_DIR = path.join(process.cwd(), 'raw-data/seoul');
const BATCH_SIZE = 500;
const TMP_SQL_FILE = '/tmp/d1_batch.sql';
const PROGRESS_FILE = path.join(process.cwd(), 'raw-data/d1_migrate_progress.json');
const DB_NAME = 'apt-trade-db';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// -------------------------
// 타입
// -------------------------
interface RawRecord {
  aptNm: string;
  aptSeq?: string;
  bonbun?: number | string;
  bubun?: number | string;
  buildYear?: number;
  cdealDay?: string;
  cdealType?: string;
  dealAmount: string;
  dealDay: number;
  dealMonth: number;
  dealYear: number;
  estateAgentSggNm?: string;
  excluUseAr: number;
  floor?: number;
  jibun?: number | string;
  roadNm?: string;
  sggCd: number;
  umdCd?: number | string;
  umdNm: string;
}

interface Progress {
  completedFiles: string[];   // 완전히 완료된 파일 경로 (relPath)
  totalRows: number;
}

// -------------------------
// 진행 상황 저장/로드
// -------------------------
function loadProgress(): Progress {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch {
    return { completedFiles: [], totalRows: 0 };
  }
}

function saveProgress(progress: Progress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// -------------------------
// 변환 헬퍼
// -------------------------
function esc(s: string | null | undefined): string {
  if (s == null) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function num(v: number | string | null | undefined): string {
  if (v == null || v === '') return 'NULL';
  const n = Number(v);
  return isNaN(n) ? 'NULL' : String(n);
}

function toInsertValues(raw: RawRecord): string {
  const dealAmount = parseInt(raw.dealAmount.replace(/,/g, ''), 10);
  const excluUseAr = raw.excluUseAr;
  const dealAmountBillion = Math.round((dealAmount / 10000) * 100) / 100;
  const areaPyeong = Math.round(excluUseAr / 3.30579);
  const pricePerPyeong = areaPyeong > 0
    ? Math.round((dealAmountBillion / areaPyeong) * 100) / 100
    : 0;

  const sggCd = String(raw.sggCd).padStart(5, '0');
  const sggNm = raw.estateAgentSggNm
    ? raw.estateAgentSggNm.replace('서울 ', '')
    : null;

  const dealYear = raw.dealYear;
  const dealMonth = raw.dealMonth;
  const dealDay = raw.dealDay;
  const dealDate = `${dealYear}-${String(dealMonth).padStart(2, '0')}-${String(dealDay).padStart(2, '0')}`;

  const cdealDay = raw.cdealDay === '' ? null : (raw.cdealDay ?? null);
  const cdealType = raw.cdealType === '' ? null : (raw.cdealType ?? null);

  return `(${dealAmount},${excluUseAr},${dealAmountBillion},${areaPyeong},${pricePerPyeong},` +
    `${esc(sggCd)},${esc(sggNm)},${esc(raw.umdNm)},${num(raw.umdCd)},` +
    `${esc(raw.aptNm)},${num(raw.jibun)},${num(raw.floor)},${num(raw.buildYear)},` +
    `${dealYear},${dealMonth},${dealDay},${esc(dealDate)},` +
    `${esc(cdealDay)},${esc(cdealType)},${esc(raw.aptSeq)},` +
    `${num(raw.bonbun)},${num(raw.bubun)},${esc(raw.roadNm)})`;
}

const INSERT_COLUMNS = `(deal_amount, exclu_use_ar, deal_amount_billion, area_pyeong, price_per_pyeong,
  sgg_cd, sgg_nm, umd_nm, umd_cd,
  apt_nm, jibun, floor, build_year,
  deal_year, deal_month, deal_day, deal_date,
  cdeal_day, cdeal_type, apt_seq,
  bonbun, bubun, road_nm)`;

// -------------------------
// 재시도 포함 배치 실행
// -------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBatch(values: string[], attempt = 1): Promise<void> {
  const sql = `INSERT INTO transactions ${INSERT_COLUMNS} VALUES\n${values.join(',\n')};`;
  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');

  try {
    execSync(
      `npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`,
      { stdio: 'pipe' }
    );
  } catch (e) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      process.stdout.write(`\n  재시도 ${attempt}/${MAX_RETRIES - 1} (${delay / 1000}s 후)...`);
      await sleep(delay);
      return runBatch(values, attempt + 1);
    }
    throw e;
  }
}

// -------------------------
// 메인
// -------------------------
async function main() {
  const progress = loadProgress();

  if (progress.completedFiles.length > 0) {
    console.log(`이전 진행 상황 복원: ${progress.completedFiles.length}개 파일 완료, ${progress.totalRows.toLocaleString()}행`);
  }

  console.log('D1 마이그레이션 시작...');
  console.log(`데이터 디렉토리: ${RAW_DATA_DIR}`);
  console.log(`배치 크기: ${BATCH_SIZE}행 | 최대 재시도: ${MAX_RETRIES}회`);

  const files = (await glob('**/[0-9]*.jsonl', { cwd: RAW_DATA_DIR, absolute: true })).sort();
  console.log(`\n총 ${files.length}개 파일 발견\n`);

  let totalRows = progress.totalRows;
  let fileIdx = 0;

  for (const file of files) {
    fileIdx++;
    const relPath = path.relative(RAW_DATA_DIR, file);

    // 이미 완료된 파일 건너뜀
    if (progress.completedFiles.includes(relPath)) {
      process.stdout.write(`[${fileIdx}/${files.length}] ${relPath} — 건너뜀 (완료됨)\n`);
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    if (lines.length === 0) continue;

    console.log(`\n[${fileIdx}/${files.length}] ${relPath} — ${lines.length}행`);

    // 배치 생성
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      const chunk = lines.slice(i, i + BATCH_SIZE);
      const values: string[] = [];
      for (const line of chunk) {
        try {
          const raw: RawRecord = JSON.parse(line);
          values.push(toInsertValues(raw));
        } catch {
          console.warn(`  파싱 오류 스킵: ${line.substring(0, 80)}...`);
        }
      }

      if (values.length === 0) continue;

      const batchNo = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(lines.length / BATCH_SIZE);

      try {
        await runBatch(values);
        totalRows += values.length;
        process.stdout.write(`\r  배치 ${batchNo}/${totalBatches} 완료 | 누적 ${totalRows.toLocaleString()}행`);
      } catch (e) {
        console.error(`\n  배치 실행 최종 실패 (파일: ${relPath}, 배치 ${batchNo}/${totalBatches}):`, e);
        saveProgress(progress);
        throw e;
      }
    }

    // 파일 완료 기록
    progress.completedFiles.push(relPath);
    progress.totalRows = totalRows;
    saveProgress(progress);
    console.log(`\n  파일 완료 → 누적 ${totalRows.toLocaleString()}행`);
  }

  console.log(`\n\n마이그레이션 완료!`);
  console.log(`총 삽입 행 수: ${totalRows.toLocaleString()}`);

  // 최종 건수 확인
  console.log('\nD1 건수 확인 중...');
  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} --command "SELECT COUNT(*) as cnt FROM transactions;" --remote`,
      { encoding: 'utf-8' }
    );
    console.log(result);
  } catch {
    console.log('건수 확인 실패 — 수동으로 확인하세요:');
    console.log(`  npx wrangler d1 execute ${DB_NAME} --command "SELECT COUNT(*) FROM transactions;" --remote`);
  }

  // 진행 상황 파일 삭제
  try { fs.unlinkSync(PROGRESS_FILE); } catch { /* 무시 */ }
}

main().catch((err) => {
  console.error('\n마이그레이션 중 오류 발생:', err);
  process.exit(1);
});
