/**
 * src/scripts/analyze-market-prices.ts
 * market-prices-raw.json → 품목별 통계 산출 (옵션2: 월별 최다 coverage 품종 자동 선택)
 *
 * 각 품목·월별로 가장 많은 지역 레코드를 가진 vrty_cd를 대표 품종으로 선택.
 * 데이터가 없는 월은 공백으로 남김 (connectNulls 제거 대응).
 *
 * 사용법: npx tsx src/scripts/analyze-market-prices.ts
 * 출력: src/data/market-stats.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { MARKET_MAPPING } from '../data/market-mapping';

const IN_FILE = path.join(process.cwd(), 'src/data/market-prices-raw.json');
const OUT_FILE = path.join(process.cwd(), 'src/data/market-stats.json');

interface PriceItem {
  exmn_ym: string;
  ctgry_cd: string;
  ctgry_nm: string;
  se_cd: string;
  item_cd: string;
  item_nm: string;
  vrty_cd: string;
  vrty_nm: string;
  grd_cd: string;
  grd_nm: string;
  unit: string;
  unit_sz: string;
  pmm_avgprc: string;
  pmm_hgprc: string;
  pmm_lwprc: string;
}

interface MonthlyStats {
  ym: string;
  high: number;
  low: number;
  avg: number;
}

interface ItemStats {
  item_cd: string;
  item_nm: string;
  ctgry_cd: string;
  ctgry_nm: string;
  unit: string;
  unit_sz: string;
  all_time_high: number;
  all_time_low: number;
  avg_avg_price: number;
  data_count: number;
  monthly: MonthlyStats[];
}

function parseNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) || n === 0 ? null : n;
}

/** IQR 기반 이상치 제거: Q3 + 1.5×IQR 초과, Q1 - 1.5×IQR 미만 값 제거 */
function removeOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return sorted.filter(v => v >= lo && v <= hi);
}

async function main() {
  const raw: PriceItem[] = JSON.parse(fs.readFileSync(IN_FILE, 'utf-8'));
  console.log(`전체 ${raw.length}건`);

  const stats: ItemStats[] = [];

  for (const mapping of Object.values(MARKET_MAPPING)) {
    if (mapping.coverage === 0) continue;

    // 해당 품목 + se_cd(소매/도매) 행 전체
    const rows = raw.filter(r =>
      r.item_cd === mapping.item_cd &&
      r.se_cd === mapping.se_cd
    );

    if (rows.length === 0) {
      console.warn(`  [no data] ${mapping.item_nm}(${mapping.item_cd})`);
      continue;
    }

    // 월 목록 (오름차순)
    const allYms = [...new Set(rows.map(r => r.exmn_ym))].sort();

    const monthly: MonthlyStats[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const avgs: number[] = [];

    for (const ym of allYms) {
      const byMonth = rows.filter(r => r.exmn_ym === ym);

      // 월별 최다 레코드 (vrty_cd, grd_cd) 조합 선택 — 등급 혼합 방지
      const comboCnt = new Map<string, number>();
      for (const r of byMonth) {
        const key = `${r.vrty_cd}|${r.grd_cd}`;
        comboCnt.set(key, (comboCnt.get(key) ?? 0) + 1);
      }
      const bestCombo = [...comboCnt.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const [bestVrty, bestGrd] = bestCombo.split('|');
      const selected = byMonth.filter(r => r.vrty_cd === bestVrty && r.grd_cd === bestGrd);

      // 선택된 품종의 지역별 행 집계 후 IQR 이상치 제거
      const rawHighs: number[] = [];
      const rawLows: number[] = [];
      const rawAvgs: number[] = [];
      for (const r of selected) {
        const h = parseNum(r.pmm_hgprc);
        const l = parseNum(r.pmm_lwprc);
        const a = parseNum(r.pmm_avgprc);
        if (h !== null) rawHighs.push(h);
        if (l !== null) rawLows.push(l);
        if (a !== null) rawAvgs.push(a);
      }

      const mHighs = removeOutliers(rawHighs);
      const mLows  = removeOutliers(rawLows);
      const mAvgs  = removeOutliers(rawAvgs);

      if (mHighs.length === 0 || mLows.length === 0 || mAvgs.length === 0) continue;

      const h = Math.max(...mHighs);
      const l = Math.min(...mLows);
      const a = Math.round(mAvgs.reduce((s, v) => s + v, 0) / mAvgs.length);

      monthly.push({ ym, high: h, low: l, avg: a });
      highs.push(h);
      lows.push(l);
      avgs.push(a);
    }

    if (monthly.length === 0) continue;

    const all_time_high = Math.max(...highs);
    const all_time_low  = Math.min(...lows);
    const avg_avg_price = Math.round(avgs.reduce((s, v) => s + v, 0) / avgs.length * 10) / 10;

    stats.push({
      item_cd: mapping.item_cd,
      item_nm: mapping.item_nm,
      ctgry_cd: mapping.ctgry_cd,
      ctgry_nm: mapping.ctgry_nm,
      unit: mapping.unit,
      unit_sz: mapping.unit_sz,
      all_time_high,
      all_time_low,
      avg_avg_price,
      data_count: monthly.length,
      monthly,
    });
  }

  stats.sort((a, b) => a.ctgry_cd.localeCompare(b.ctgry_cd) || a.item_cd.localeCompare(b.item_cd));

  fs.writeFileSync(OUT_FILE, JSON.stringify(stats, null, 2), 'utf-8');

  console.log(`\n유니크 품목 수: ${stats.length}개\n`);
  let prevCtgry = '';
  for (const s of stats) {
    if (s.ctgry_cd !== prevCtgry) {
      console.log(`\n[${s.ctgry_cd}] ${s.ctgry_nm}`);
      prevCtgry = s.ctgry_cd;
    }
    console.log(
      `  ${s.item_nm}(${s.item_cd})  ` +
      `최고 ${s.all_time_high.toLocaleString()}  ` +
      `최저 ${s.all_time_low.toLocaleString()}  ` +
      `평균 ${s.avg_avg_price.toLocaleString()}  ` +
      `[${s.unit_sz}${s.unit}] n=${s.data_count}`
    );
  }

  console.log(`\n✅ 저장: ${OUT_FILE}`);
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
