/**
 * src/scripts/fetch-market-daily.ts
 * aT 일별 도소매 가격 최신 데이터를 수집하여 파일로 저장
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/fetch-market-daily.ts
 *
 * 출력: src/data/market-prices-daily-raw.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { MARKET_MAPPING } from '../data/market-mapping';

const OUT_FILE = path.join(process.cwd(), 'src/data/market-prices-daily-raw.json');
const PAGE_SIZE = 1000;

const API_KEY = process.env.DATA_GO_KR_API_KEY;
if (!API_KEY) {
  console.error('DATA_GO_KR_API_KEY 환경변수가 필요합니다');
  process.exit(1);
}

interface DayPriceRow {
  exmn_ymd: string;
  ctgry_cd: string;
  ctgry_nm: string;
  se_cd: string;
  se_nm: string;
  item_cd: string;
  item_nm: string;
  vrty_cd: string;
  vrty_nm: string;
  grd_cd: string;
  grd_nm: string;
  unit: string;
  unit_sz: string;
  exmn_dd_cnvs_prc: string; // 일별 환산가
  mrkt_nm?: string;
}

interface DailyResult {
  item_cd: string;
  item_nm: string;
  ctgry_cd: string;
  exmn_ymd: string;      // 가장 최신 조사일
  se_cd: string;
  latest_price: number;  // 중앙값
  unit: string;
  unit_sz: string;
  days_ago: number;      // 오늘 기준 데이터 신선도
  raw_count: number;     // 원본 행 수 (디버깅용)
}

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function calcDaysAgo(ymd: string): number {
  const today = new Date();
  const y = parseInt(ymd.slice(0, 4));
  const m = parseInt(ymd.slice(4, 6)) - 1;
  const day = parseInt(ymd.slice(6, 8));
  const d = new Date(y, m, day);
  return Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * exmn_dd_cnvs_prc 는 "환산가":
 *   - 중량(unit='kg' 또는 'g'): per 1kg 가격
 *   - 개수(개/마리/포기/장/봉/묶음/손 등): per unit_sz 패키지 가격
 * market-stats (pmm_avgprc) 는 모두 per-package 가격.
 * 비교를 위해 per-package 로 통일.
 */
function toPricePerPackage(cnvs_prc: number, unit: string, unit_sz: string): number {
  const sz = parseFloat(unit_sz);
  if (isNaN(sz) || sz <= 0) return cnvs_prc;
  if (unit === 'kg') return Math.round(cnvs_prc * sz);
  if (unit === 'g') return Math.round(cnvs_prc * sz / 1000);
  return cnvs_prc; // 개수 품목: 이미 per-package
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

async function fetchItemDaily(
  ctgry_cd: string,
  item_cd: string,
  vrty_cd: string,
  grd_cd: string,
  gteDate: string,
  lteDate: string
): Promise<DayPriceRow[]> {
  const url = new URL('https://apis.data.go.kr/B552845/perDay/price');
  url.searchParams.set('serviceKey', API_KEY!);
  url.searchParams.set('numOfRows', String(PAGE_SIZE));
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('cond[ctgry_cd::EQ]', ctgry_cd);
  url.searchParams.set('cond[item_cd::EQ]', item_cd);
  if (vrty_cd) url.searchParams.set('cond[vrty_cd::EQ]', vrty_cd);
  if (grd_cd) url.searchParams.set('cond[grd_cd::EQ]', grd_cd);
  url.searchParams.set('cond[exmn_ymd::GTE]', gteDate);
  url.searchParams.set('cond[exmn_ymd::LTE]', lteDate);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as {
    response: {
      header: { resultCode: string; resultMsg: string };
      body: {
        totalCount: number;
        items: { item: DayPriceRow | DayPriceRow[] } | null;
      };
    };
  };

  const { resultCode, resultMsg } = data.response.header;
  if (resultCode !== '00' && resultCode !== '0') {
    throw new Error(`API 오류: ${resultCode} ${resultMsg}`);
  }

  const raw = data.response.body?.items?.item;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

async function main() {
  const today = getDateString(0);
  const gte14 = getDateString(14);

  console.log(`조회 기간: ${gte14} ~ ${today}`);
  console.log(`대상 품목: MARKET_MAPPING 전체\n`);

  const results: DailyResult[] = [];
  const items = Object.values(MARKET_MAPPING);

  let done = 0;
  let skipped = 0;
  let no_data = 0;

  for (const mapping of items) {
    // coverage=0 이면 skip
    if (mapping.coverage === 0) {
      skipped++;
      continue;
    }

    try {
      const rows = await fetchItemDaily(mapping.ctgry_cd, mapping.item_cd, mapping.vrty_cd, mapping.grd_cd, gte14, today);

      if (rows.length === 0) {
        console.log(`  [skip] ${mapping.item_nm}(${mapping.item_cd}) — 0건`);
        no_data++;
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      // 가장 최신 exmn_ymd 찾기
      const dates = rows
        .map(r => r.exmn_ymd)
        .filter(d => d && d.length === 8)
        .sort()
        .reverse();
      const latestDate = dates[0];
      if (!latestDate) {
        console.log(`  [skip] ${mapping.item_nm}(${mapping.item_cd}) — 날짜 파싱 실패`);
        no_data++;
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      // 최신 날짜 기준 필터
      const latestRows = rows.filter(r => r.exmn_ymd === latestDate);

      // se_cd 우선순위: mapping.se_cd 우선 (없으면 01, 최후에 02)
      const preferredSe = mapping.se_cd || '01';
      const seRows = latestRows.filter(r => r.se_cd === preferredSe);
      const targetRows = seRows.length > 0 ? seRows : latestRows;

      // exmn_dd_cnvs_prc 중앙값
      const prices = targetRows
        .map(r => parseFloat(r.exmn_dd_cnvs_prc))
        .filter(p => !isNaN(p) && p > 0);

      if (prices.length === 0) {
        console.log(`  [skip] ${mapping.item_nm}(${mapping.item_cd}) — 유효 가격 없음`);
        no_data++;
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      const cnvs_median = median(prices);
      const actualSe = targetRows[0]?.se_cd || preferredSe;
      const unit = targetRows[0]?.unit || mapping.unit;
      const unit_sz = targetRows[0]?.unit_sz || mapping.unit_sz;
      // per-package 가격으로 변환 (market-stats pmm_avgprc 와 동일 기준)
      const latestPrice = toPricePerPackage(cnvs_median, unit, unit_sz);
      const daysAgo = calcDaysAgo(latestDate);

      results.push({
        item_cd: mapping.item_cd,
        item_nm: mapping.item_nm,
        ctgry_cd: mapping.ctgry_cd,
        exmn_ymd: latestDate,
        se_cd: actualSe,
        latest_price: latestPrice,
        unit,
        unit_sz,
        days_ago: daysAgo,
        raw_count: rows.length,
      });

      done++;
      console.log(
        `  ✓ ${mapping.item_nm}(${mapping.item_cd})  ${latestDate}  ` +
        `${latestPrice.toLocaleString()}원/${unit_sz}${unit}  ` +
        `(cnvs=${Math.round(cnvs_median).toLocaleString()})  ` +
        `se_cd=${actualSe}  raw=${rows.length}건  D-${daysAgo}`
      );
    } catch (err) {
      console.error(`  ✗ ${mapping.item_nm}(${mapping.item_cd})`, err);
      no_data++;
    }

    await new Promise(r => setTimeout(r, 150));
  }

  // ctgry_cd → item_cd 순 정렬
  results.sort((a, b) => a.ctgry_cd.localeCompare(b.ctgry_cd) || a.item_cd.localeCompare(b.item_cd));

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\n✅ 저장 완료: ${OUT_FILE}`);
  console.log(`   수집: ${done}건 / coverage=0 skip: ${skipped}건 / 데이터없음: ${no_data}건`);
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
