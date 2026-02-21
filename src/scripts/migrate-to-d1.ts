/**
 * src/scripts/migrate-to-d1.ts
 * JSONL 데이터를 Cloudflare D1으로 적재하는 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx src/scripts/migrate-to-d1.ts
 *
 * 전제조건:
 *   - wrangler.jsonc에 database_id가 기입되어 있을 것
 *   - npx wrangler login 상태일 것
 *   - raw-data/seoul/YYYY/MM.jsonl 파일들이 존재할 것
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

// -------------------------
// 설정
// -------------------------
const RAW_DATA_DIR = path.join(process.cwd(), 'raw-data/seoul');
const BATCH_SIZE = 500; // D1 SQL 파일 크기 제한 대비 보수적 설정
const TMP_SQL_FILE = '/tmp/d1_batch.sql';
const DB_NAME = 'apt-trade-db';

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

// -------------------------
// 변환 헬퍼
// -------------------------
function esc(s: string | null | undefined): string {
  if (s == null) return 'NULL';
  // SQL 인젝션 방지: 작은따옴표 이스케이프
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
// 실행 헬퍼
// -------------------------
function runBatch(values: string[], batchNum: number, totalBatches: number): void {
  // D1 --remote는 BEGIN TRANSACTION 구문을 지원하지 않음 — wrangler가 자동으로 트랜잭션 처리
  const sql = `INSERT INTO transactions ${INSERT_COLUMNS} VALUES\n${values.join(',\n')};`;

  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');

  execSync(
    `npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`,
    { stdio: 'pipe' }
  );

  process.stdout.write(`\r배치 ${batchNum}/${totalBatches} 완료`);
}

// -------------------------
// 메인
// -------------------------
async function main() {
  console.log('D1 마이그레이션 시작...');
  console.log(`데이터 디렉토리: ${RAW_DATA_DIR}`);
  console.log(`배치 크기: ${BATCH_SIZE}행`);

  // JSONL 파일 목록 수집 (연도/월 순으로 정렬)
  const files = (await glob('**/[0-9]*.jsonl', { cwd: RAW_DATA_DIR, absolute: true })).sort();
  console.log(`\n총 ${files.length}개 파일 발견\n`);

  let totalRows = 0;
  let totalBatchesRun = 0;
  let fileIdx = 0;

  for (const file of files) {
    fileIdx++;
    const relPath = path.relative(RAW_DATA_DIR, file);
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    if (lines.length === 0) continue;

    console.log(`\n[${fileIdx}/${files.length}] ${relPath} — ${lines.length}행`);

    // 배치 분할
    const batches: string[][] = [];
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
      if (values.length > 0) batches.push(values);
    }

    // 배치 실행
    for (let b = 0; b < batches.length; b++) {
      totalBatchesRun++;
      try {
        runBatch(batches[b], totalBatchesRun, -1 /* 사전 계산 불필요 */);
        totalRows += batches[b].length;
      } catch (e) {
        console.error(`\n  배치 실행 실패 (파일: ${relPath}, 배치 ${b + 1}):`, e);
        throw e;
      }
    }

    console.log(`  누적 ${totalRows.toLocaleString()}행 삽입 완료`);
  }

  console.log(`\n\n마이그레이션 완료!`);
  console.log(`총 삽입 행 수: ${totalRows.toLocaleString()}`);
  console.log(`총 배치 수  : ${totalBatchesRun}`);

  // 최종 건수 확인
  console.log('\nD1 건수 확인 중...');
  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} --command "SELECT COUNT(*) as cnt FROM transactions;" --remote`,
      { encoding: 'utf-8' }
    );
    console.log(result);
  } catch {
    console.log('건수 확인 실패 (수동으로 확인하세요):');
    console.log(`  npx wrangler d1 execute ${DB_NAME} --command "SELECT COUNT(*) FROM transactions;" --remote`);
  }
}

main().catch((err) => {
  console.error('\n마이그레이션 중 오류 발생:', err);
  process.exit(1);
});
