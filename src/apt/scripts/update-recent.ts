/**
 * src/scripts/update-recent.ts
 * 최근 N개월 아파트 실거래 데이터를 API에서 받아와 D1을 DELETE+INSERT 방식으로 갱신합니다.
 *
 * 사용법:
 *   npx tsx src/scripts/update-recent.ts [--dry-run]
 *
 * 환경변수:
 *   DATA_GO_KR_API_KEY    공공데이터 API 키 (필수)
 *   CLOUDFLARE_API_TOKEN  wrangler 인증 (CI 환경 필수)
 *   CLOUDFLARE_ACCOUNT_ID wrangler 계정 (CI 환경 필수)
 *   UPDATE_MONTHS         교체 월 수 (기본 3, 최대 12)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import * as fs from 'fs';
import { execSync } from 'child_process';
import { getRawApartmentTransactions, getRawSilvTradeTransactions } from '@apt/lib/api/apartment';
import { regions } from '@shared/data/regions';
import type { TransactionItem, SilvTradeItem } from '@apt/types/real-estate';

// -------------------------
// 설정
// -------------------------
const DB_NAME = 'apt-trade-db';
const TMP_SQL_FILE = '/tmp/d1_update_recent.sql';
const BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const API_CALL_DELAY_MS = 300;

const isDryRun = process.argv.includes('--dry-run');
const UPDATE_MONTHS = Math.min(12, Math.max(1, parseInt(process.env.UPDATE_MONTHS || '3', 10)));

// 서울 25개 구 코드 목록
const SEOUL_REGIONS = regions.filter(r => r.parent === '서울특별시');

// -------------------------
// 날짜 헬퍼
// -------------------------
function getTargetMonths(count: number): Array<{ year: number; month: number; yyyymm: string }> {
  const now = new Date();
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    result.push({ year, month, yyyymm: `${year}${String(month).padStart(2, '0')}` });
  }
  return result;
}

// -------------------------
// SQL 변환 헬퍼
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

function toInsertValues(item: TransactionItem | SilvTradeItem, dealType: '매매' | '신규분양권' | '입주권'): string {
  const dealAmount = parseInt(String(item.dealAmount).replace(/,/g, ''), 10);
  const excluUseAr = Number(item.excluUseAr) || 0;
  const dealAmountBillion = Math.round((dealAmount / 10000) * 100) / 100;
  const areaPyeong = Math.round(excluUseAr / 3.30579);
  const pricePerPyeong = areaPyeong > 0
    ? Math.round((dealAmountBillion / areaPyeong) * 100) / 100
    : 0;

  const sggCd = String(item.sggCd).padStart(5, '0');
  const sggNm = item.estateAgentSggNm
    ? item.estateAgentSggNm.replace('서울 ', '')
    : null;

  const dealYear = Number(item.dealYear);
  const dealMonth = Number(item.dealMonth);
  const dealDay = Number(item.dealDay);
  const dealDate = `${dealYear}-${String(dealMonth).padStart(2, '0')}-${String(dealDay).padStart(2, '0')}`;

  const cdealDay = item.cdealDay === '' ? null : (item.cdealDay ?? null);
  const cdealType = item.cdealType === '' ? null : (item.cdealType ?? null);

  // 매매 전용 필드 (분양권은 null)
  const aptSeq = 'aptSeq' in item ? item.aptSeq : null;
  const bonbun = 'bonbun' in item ? item.bonbun : null;
  const bubun = 'bubun' in item ? item.bubun : null;
  const roadNm = 'roadNm' in item ? item.roadNm : null;
  const buildYear = 'buildYear' in item ? item.buildYear : null;

  // 분양권 전용 필드 (매매는 null)
  const ownershipGbn = 'ownershipGbn' in item ? item.ownershipGbn : null;
  const slerGbn = item.slerGbn ?? null;
  const buyerGbn = item.buyerGbn ?? null;

  const jibunVal = 'jibun' in item ? item.jibun : null;
  const umdCdVal = 'umdCd' in item ? (item as TransactionItem).umdCd : undefined;

  return `(${dealAmount},${excluUseAr},${dealAmountBillion},${areaPyeong},${pricePerPyeong},` +
    `${esc(sggCd)},${esc(sggNm)},${esc(item.umdNm)},${num(umdCdVal)},` +
    `${esc(item.aptNm)},${num(jibunVal)},${num(item.floor)},${num(buildYear)},` +
    `${dealYear},${dealMonth},${dealDay},${esc(dealDate)},` +
    `${esc(cdealDay)},${esc(cdealType)},${esc(aptSeq)},` +
    `${num(bonbun)},${num(bubun)},${esc(roadNm)},` +
    `${esc(dealType)},${esc(ownershipGbn)},${esc(slerGbn)},${esc(buyerGbn)})`;
}

const INSERT_COLUMNS = `(deal_amount, exclu_use_ar, deal_amount_billion, area_pyeong, price_per_pyeong,
  sgg_cd, sgg_nm, umd_nm, umd_cd,
  apt_nm, jibun, floor, build_year,
  deal_year, deal_month, deal_day, deal_date,
  cdeal_day, cdeal_type, apt_seq,
  bonbun, bubun, road_nm,
  deal_type, ownership_gbn, sler_gbn, buyer_gbn)`;

// -------------------------
// 재시도 포함 wrangler 실행
// -------------------------
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSQL(sql: string, label: string, attempt = 1): Promise<void> {
  if (isDryRun) {
    process.stdout.write(`  [dry-run] ${label}\n`);
    return;
  }
  process.stdout.write(`  ${label}\n`);
  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');
  try {
    execSync(
      `npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`,
      { stdio: 'pipe' }
    );
  } catch (e) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      process.stdout.write(`  재시도 ${attempt}/${MAX_RETRIES - 1} (${delay / 1000}s 후)...\n`);
      await sleep(delay);
      return runSQL(sql, label, attempt + 1);
    }
    throw e;
  }
}

// -------------------------
// 월별 업데이트
// -------------------------
async function updateMonth(year: number, month: number, yyyymm: string): Promise<{ trade: number; silv: number }> {
  // === 매매 + 분양권 동시 수집 (구별로 Promise.all 병렬) ===
  const tradeItems: TransactionItem[] = [];
  const silvItems: SilvTradeItem[] = [];

  for (let i = 0; i < SEOUL_REGIONS.length; i++) {
    const region = SEOUL_REGIONS[i];
    const [tradeResult, silvResult] = await Promise.all([
      getRawApartmentTransactions(region.code, yyyymm, 1000).catch(e => {
        console.warn(`  [경고] 매매 ${region.name}(${region.code}) ${yyyymm} API 실패:`, e);
        return null;
      }),
      getRawSilvTradeTransactions(region.code, yyyymm, 1000).catch(e => {
        console.warn(`  [경고] 분양권 ${region.name}(${region.code}) ${yyyymm} API 실패:`, e);
        return null;
      }),
    ]);
    if (tradeResult && tradeResult.transactions.length > 0) tradeItems.push(...tradeResult.transactions);
    if (silvResult && silvResult.transactions.length > 0) silvItems.push(...silvResult.transactions);
    process.stdout.write(`\r  API 진행: ${i + 1}/${SEOUL_REGIONS.length} (매매 ${tradeItems.length}건, 분양권 ${silvItems.length}건)`);
    await sleep(API_CALL_DELAY_MS);
  }
  console.log('');

  // === DELETE: deal_type 별로 분리 ===
  const deleteTradeSql = `DELETE FROM apt_transactions WHERE deal_year = ${year} AND deal_month = ${month} AND deal_type = '매매';`;
  const deleteSilvSql = `DELETE FROM apt_transactions WHERE deal_year = ${year} AND deal_month = ${month} AND deal_type IN ('신규분양권', '입주권');`;
  await runSQL(deleteTradeSql, `DELETE 매매 ${yyyymm}`);
  await runSQL(deleteSilvSql, `DELETE 분양권 ${yyyymm}`);

  // === INSERT 매매 ===
  let tradeInserted = 0;
  if (tradeItems.length > 0) {
    const valueRows: string[] = [];
    for (const item of tradeItems) {
      try { valueRows.push(toInsertValues(item, '매매')); } catch { /* 변환 실패 무시 */ }
    }
    const totalBatches = Math.ceil(valueRows.length / BATCH_SIZE);
    for (let i = 0; i < valueRows.length; i += BATCH_SIZE) {
      const batch = valueRows.slice(i, i + BATCH_SIZE);
      const batchNo = Math.floor(i / BATCH_SIZE) + 1;
      const insertSql = `INSERT INTO apt_transactions ${INSERT_COLUMNS} VALUES\n${batch.join(',\n')};`;
      await runSQL(insertSql, `INSERT 매매 ${yyyymm} 배치 ${batchNo}/${totalBatches} (${batch.length}건)`);
    }
    tradeInserted = valueRows.length;
  }

  // === INSERT 분양권/입주권 ===
  let silvInserted = 0;
  if (silvItems.length > 0) {
    const valueRows: string[] = [];
    for (const item of silvItems) {
      const gbn = String(item.dealingGbn ?? '');
      const dealType: '신규분양권' | '입주권' = gbn === '02' ? '입주권' : '신규분양권';
      try { valueRows.push(toInsertValues(item, dealType)); } catch { /* 변환 실패 무시 */ }
    }
    const totalBatches = Math.ceil(valueRows.length / BATCH_SIZE);
    for (let i = 0; i < valueRows.length; i += BATCH_SIZE) {
      const batch = valueRows.slice(i, i + BATCH_SIZE);
      const batchNo = Math.floor(i / BATCH_SIZE) + 1;
      const insertSql = `INSERT INTO apt_transactions ${INSERT_COLUMNS} VALUES\n${batch.join(',\n')};`;
      await runSQL(insertSql, `INSERT 분양권 ${yyyymm} 배치 ${batchNo}/${totalBatches} (${batch.length}건)`);
    }
    silvInserted = valueRows.length;
  }

  return { trade: tradeInserted, silv: silvInserted };
}

// -------------------------
// 메인
// -------------------------
async function main() {
  const months = getTargetMonths(UPDATE_MONTHS);

  console.log(`\n=== 아파트 실거래 데이터 업데이트 ===`);
  console.log(`대상 기간: ${months[0].yyyymm} ~ ${months[months.length - 1].yyyymm} (${UPDATE_MONTHS}개월)`);
  console.log(`대상 지역: 서울 ${SEOUL_REGIONS.length}개 구`);
  if (isDryRun) console.log(`*** DRY RUN — D1 실행 생략 ***`);
  console.log('');

  let totalInserted = 0;

  for (const { year, month, yyyymm } of months) {
    console.log(`[${yyyymm}] 처리 중...`);
    try {
      const { trade, silv } = await updateMonth(year, month, yyyymm);
      totalInserted += trade + silv;
      console.log(`[${yyyymm}] 완료 — 매매 ${trade.toLocaleString()}건, 분양권 ${silv.toLocaleString()}건 적재\n`);
    } catch (e) {
      console.error(`[${yyyymm}] 실패:`, e);
      process.exit(1);
    }
  }

  console.log(`업데이트 완료! 총 ${totalInserted.toLocaleString()}건 적재`);
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
