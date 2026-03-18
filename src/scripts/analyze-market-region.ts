/**
 * src/scripts/analyze-market-region.ts
 * market-prices-raw.json → 품목×지역별 통계 산출 (combos[] nested 구조)
 *
 * 각 item_cd × sgg_cd 조합별로 모든 vrty_cd×grd_cd combo를 포함.
 * combos[] 내 각 combo는 is_default, monthly, percentile, cheapness_score 포함.
 *
 * 사용법: npx tsx src/scripts/analyze-market-region.ts
 * 출력: src/data/market-stats-by-region.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { MARKET_MAPPING } from '../data/market-mapping';

const IN_FILE = path.join(process.cwd(), 'src/data/market-prices-raw.json');
const OUT_FILE = path.join(process.cwd(), 'src/data/market-stats-by-region.json');

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
  sgg_cd: string;
  sgg_nm: string;
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

interface ComboStats {
  vrty_cd: string;
  vrty_label: string;
  grd_cd: string;
  grd_label: string;
  is_default: boolean;
  monthly: MonthlyStats[];
  latest_price: number;
  latest_ym: string;
  percentile: number;
  cheapness_score: number;
}

interface RegionItemStats {
  item_cd: string;
  item_nm: string;
  ctgry_cd: string;
  ctgry_nm: string;
  sgg_cd: string;
  sgg_nm: string;
  se_cd: string;
  unit: string;
  unit_sz: string;
  combos: ComboStats[];
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

/** 해당 rows에서 월별 IQR+집계 → MonthlyStats[] */
function buildMonthly(rows: PriceItem[]): MonthlyStats[] {
  const allYms = [...new Set(rows.map(r => r.exmn_ym))].sort();
  const monthly: MonthlyStats[] = [];

  for (const ym of allYms) {
    const byMonth = rows.filter(r => r.exmn_ym === ym);
    const rawHighs: number[] = [];
    const rawLows: number[] = [];
    const rawAvgs: number[] = [];

    for (const r of byMonth) {
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

    monthly.push({
      ym,
      high: Math.max(...mHighs),
      low: Math.min(...mLows),
      avg: Math.round(mAvgs.reduce((s, v) => s + v, 0) / mAvgs.length),
    });
  }

  return monthly;
}

/** percentile, cheapness_score 계산 */
function calcScores(monthly: MonthlyStats[], latestPrice: number): { percentile: number; cheapness_score: number } {
  const avgs = monthly.map(m => m.avg);
  const N = avgs.length;
  const percentile = avgs.filter(v => v <= latestPrice).length / N;
  const mean = avgs.reduce((s, v) => s + v, 0) / N;
  const std = Math.sqrt(avgs.reduce((s, v) => s + (v - mean) ** 2, 0) / N);
  const cheapness_score = std === 0 ? 0 : (mean - latestPrice) / std;
  return {
    percentile: Math.round(percentile * 1000) / 1000,
    cheapness_score: Math.round(cheapness_score * 1000) / 1000,
  };
}

function main() {
  const raw: PriceItem[] = JSON.parse(fs.readFileSync(IN_FILE, 'utf-8'));
  console.log(`전체 ${raw.length}건`);

  const results: RegionItemStats[] = [];

  // item_cd별 se_cd 결정 (analyze-market-prices.ts와 동일 로직)
  const seDecision = new Map<string, string>();
  for (const mapping of Object.values(MARKET_MAPPING)) {
    if (mapping.coverage === 0) continue;
    const wholesaleRows = raw.filter(r => r.item_cd === mapping.item_cd && r.se_cd === '02');
    const wholesaleLatest = wholesaleRows.length
      ? Math.max(...wholesaleRows.map(r => parseInt(r.exmn_ym)))
      : 0;
    const useSe = wholesaleLatest >= 202601 ? '02' : '01';
    seDecision.set(mapping.item_cd, useSe);
  }

  // item_cd × sgg_cd 조합 수집
  const itemSggSet = new Map<string, Set<string>>();
  for (const r of raw) {
    if (!seDecision.has(r.item_cd)) continue;
    const useSe = seDecision.get(r.item_cd)!;
    if (r.se_cd !== useSe) continue;
    if (!itemSggSet.has(r.item_cd)) itemSggSet.set(r.item_cd, new Set());
    itemSggSet.get(r.item_cd)!.add(r.sgg_cd);
  }

  let totalRegions = 0;

  for (const [item_cd, sggCds] of itemSggSet) {
    const useSe = seDecision.get(item_cd)!;
    const itemRows = raw.filter(r => r.item_cd === item_cd && r.se_cd === useSe);
    if (itemRows.length === 0) continue;

    const firstRow = itemRows[0];
    const mapping = MARKET_MAPPING[item_cd];
    const unit = useSe === '02' ? firstRow.unit : (mapping?.unit ?? firstRow.unit);
    const unit_sz = useSe === '02' ? firstRow.unit_sz : (mapping?.unit_sz ?? firstRow.unit_sz);
    const ctgry_cd = mapping?.ctgry_cd ?? firstRow.ctgry_cd;
    const ctgry_nm = mapping?.ctgry_nm ?? firstRow.ctgry_nm;

    // bestCombo 결정 (전체 item × 모든 지역 기준으로 공통 결정)
    const comboCnt = new Map<string, number>();
    for (const r of itemRows) {
      const key = `${r.vrty_cd}|${r.grd_cd}`;
      comboCnt.set(key, (comboCnt.get(key) ?? 0) + 1);
    }
    const preferKey = mapping ? `${mapping.vrty_cd}|${mapping.grd_cd}` : '';
    const sortedCombos = [...comboCnt.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      if (a[0] === preferKey) return -1;
      if (b[0] === preferKey) return 1;
      return a[0].localeCompare(b[0]);
    });
    const bestComboKey = sortedCombos[0][0];

    for (const sgg_cd of sggCds) {
      const sggFirstRow = itemRows.find(r => r.sgg_cd === sgg_cd);
      if (!sggFirstRow) continue;
      const sgg_nm = sggFirstRow.sgg_nm;

      // 이 지역에서 등장하는 모든 vrty×grd 조합 수집
      const sggRows = itemRows.filter(r => r.sgg_cd === sgg_cd);
      const comboYms = new Map<string, { vrty_cd: string; vrty_nm: string; grd_cd: string; grd_nm: string; yms: Set<string> }>();

      for (const r of sggRows) {
        const key = `${r.vrty_cd}|${r.grd_cd}`;
        if (!comboYms.has(key)) {
          comboYms.set(key, { vrty_cd: r.vrty_cd, vrty_nm: r.vrty_nm, grd_cd: r.grd_cd, grd_nm: r.grd_nm, yms: new Set() });
        }
        comboYms.get(key)!.yms.add(r.exmn_ym);
      }

      // 3개월 미만 조합 제외
      const validCombos = [...comboYms.entries()]
        .filter(([, v]) => v.yms.size >= 3)
        .map(([key, v]) => ({ key, ...v }));

      if (validCombos.length === 0) continue;

      const comboStatsList: ComboStats[] = [];

      for (const combo of validCombos) {
        const comboRows = sggRows.filter(r => r.vrty_cd === combo.vrty_cd && r.grd_cd === combo.grd_cd);
        const monthly = buildMonthly(comboRows);
        if (monthly.length === 0) continue;

        const latestMonthly = monthly[monthly.length - 1];
        const latestPrice = latestMonthly.avg;
        const scores = calcScores(monthly, latestPrice);

        comboStatsList.push({
          vrty_cd: combo.vrty_cd,
          vrty_label: combo.vrty_nm,
          grd_cd: combo.grd_cd,
          grd_label: combo.grd_nm,
          is_default: combo.key === bestComboKey,
          monthly,
          latest_price: latestPrice,
          latest_ym: latestMonthly.ym,
          percentile: scores.percentile,
          cheapness_score: scores.cheapness_score,
        });
      }

      if (comboStatsList.length === 0) continue;

      // is_default가 없으면 첫 번째를 default로 설정
      const hasDefault = comboStatsList.some(c => c.is_default);
      if (!hasDefault && comboStatsList.length > 0) {
        comboStatsList[0].is_default = true;
      }

      results.push({
        item_cd,
        item_nm: firstRow.item_nm,
        ctgry_cd,
        ctgry_nm,
        sgg_cd,
        sgg_nm,
        se_cd: useSe,
        unit,
        unit_sz,
        combos: comboStatsList,
      });

      totalRegions++;
    }
  }

  // item_cd, sgg_cd 순 정렬
  results.sort((a, b) => {
    if (a.item_cd !== b.item_cd) return a.item_cd.localeCompare(b.item_cd);
    return a.sgg_cd.localeCompare(b.sgg_cd);
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  const uniqueRegions = new Set(results.map(r => r.sgg_cd)).size;
  const uniqueItems = new Set(results.map(r => r.item_cd)).size;
  const totalCombos = results.reduce((s, r) => s + r.combos.length, 0);

  console.log(`\n지역 수: ${uniqueRegions}개`);
  console.log(`품목 수: ${uniqueItems}개`);
  console.log(`총 레코드 수: ${results.length}건 (item×지역 조합)`);
  console.log(`총 combo 수: ${totalCombos}건`);
  console.log(`\n저장: ${OUT_FILE}`);
}

main();
