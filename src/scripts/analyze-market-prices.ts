/**
 * src/scripts/analyze-market-prices.ts
 * market-prices-raw.json → 품목별 통계 산출 (옵션2: 월별 최다 coverage 품종 자동 선택)
 *
 * 각 품목·월별로 가장 많은 지역 레코드를 가진 vrty_cd를 대표 품종으로 선택.
 * 데이터가 없는 월은 공백으로 남김 (connectNulls 제거 대응).
 *
 * 사용법: npx tsx src/scripts/analyze-market-prices.ts
 * 출력: src/data/market-stats.json, src/data/market-stats-grades.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { MARKET_MAPPING } from '../data/market-mapping';

const IN_FILE = path.join(process.cwd(), 'src/data/market-prices-raw.json');
const OUT_FILE = path.join(process.cwd(), 'src/data/market-stats.json');
const OUT_GRADES_FILE = path.join(process.cwd(), 'src/data/market-stats-grades.json');

// grd_cd → 표시 라벨 (API 제공 전체 등급)
const GRD_LABEL_MAP: Record<string, string> = {
  // 크기 등급 (수산물)
  '20': '대', '21': '중', '22': '소',
  // 품질 등급 (채소/과일/특용작물)
  '04': '상품', '05': '중품',
  // 감귤 크기
  '15': 'M과', '16': 'S과',
  // 포도 크기
  '24': 'L과', '25': 'M과',
  // 마른멸치 크기
  '27': '대멸', '28': '중멸', '29': '세멸',
};

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

interface VarietyStats {
  vrty_cd: string;
  vrty_label: string;
  is_default: boolean;
  coverage: number;
  monthly: MonthlyStats[];
}

interface GradeStats {
  grd_cd: string;
  grd_label: string;
  is_default: boolean;
  varieties: VarietyStats[];
}

interface GradeGroup {
  grades: GradeStats[];
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
  se_cd: string;
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

    // 도매 우선: 도매 최신 데이터가 202601 이상이면 도매, 아니면 소매 폴백
    const wholesaleRows = raw.filter(r =>
      r.item_cd === mapping.item_cd && r.se_cd === '02'
    );
    const retailRows = raw.filter(r =>
      r.item_cd === mapping.item_cd && r.se_cd === '01'
    );

    const wholesaleLatest = wholesaleRows.length
      ? Math.max(...wholesaleRows.map(r => parseInt(r.exmn_ym)))
      : 0;

    const useSe = wholesaleLatest >= 202601 ? '02' : '01';
    const rows = useSe === '02' ? wholesaleRows : retailRows;

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
      // 동률 시 market-mapping.ts의 대표 vrty_cd|grd_cd 우선 → 월별 일관성 보장
      const comboCnt = new Map<string, number>();
      for (const r of byMonth) {
        const key = `${r.vrty_cd}|${r.grd_cd}`;
        comboCnt.set(key, (comboCnt.get(key) ?? 0) + 1);
      }
      const preferKey = `${mapping.vrty_cd}|${mapping.grd_cd}`;
      const bestCombo = [...comboCnt.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];          // 1순위: 레코드 수 많은 것
        if (a[0] === preferKey) return -1;               // 2순위: mapping 대표 조합
        if (b[0] === preferKey) return 1;
        return a[0].localeCompare(b[0]);                 // 3순위: 알파벳 순 (안정적)
      })[0][0];
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

    // 도매 품목은 raw 데이터의 unit/unit_sz 사용 (mapping과 다를 수 있음)
    const firstRow = rows[0];
    const unit = useSe === '02' ? firstRow.unit : mapping.unit;
    const unit_sz = useSe === '02' ? firstRow.unit_sz : mapping.unit_sz;

    stats.push({
      item_cd: mapping.item_cd,
      item_nm: mapping.item_nm,
      ctgry_cd: mapping.ctgry_cd,
      ctgry_nm: mapping.ctgry_nm,
      unit,
      unit_sz,
      se_cd: useSe,
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
      `[${s.se_cd === '02' ? '도매' : '소매'}]  ` +
      `최고 ${s.all_time_high.toLocaleString()}  ` +
      `최저 ${s.all_time_low.toLocaleString()}  ` +
      `평균 ${s.avg_avg_price.toLocaleString()}  ` +
      `[${s.unit_sz}${s.unit}] n=${s.data_count}`
    );
  }

  console.log(`\n✅ 저장: ${OUT_FILE}`);

  // ----------------------------------------------------------------
  // market-stats-grades.json 생성: 크기 등급(大/中/小) 토글 품목
  // ----------------------------------------------------------------
  await buildGradeStats(raw, stats);
}

async function buildGradeStats(raw: PriceItem[], statsArr: ItemStats[]) {
  // API가 제공하는 (grd_cd × vrty_cd) 조합을 그대로 반영 — 임의 필터 없음
  const itemCds = [...new Set(raw.map(r => r.item_cd))];
  const gradeGroups: Record<string, GradeGroup> = {};

  // 품목별 se_cd 맵 (도매 우선 결정된 값)
  const seMap = new Map(statsArr.map(s => [s.item_cd, s.se_cd]));

  for (const item_cd of itemCds) {
    // 도매 품목이면 도매 데이터로 grade group 생성
    const useSe = seMap.get(item_cd) ?? '01';
    const rows = raw.filter(r => r.item_cd === item_cd && r.se_cd === useSe);
    if (rows.length === 0) continue;

    const item_nm = rows[0].item_nm;

    // (grd_cd, vrty_cd) 조합별 coverage 수집
    type ComboKey = string; // `${grd_cd}|${vrty_cd}`
    const comboYms = new Map<ComboKey, Set<string>>();
    const comboMeta = new Map<ComboKey, { grd_cd: string; grd_nm: string; vrty_cd: string; vrty_nm: string }>();

    for (const r of rows) {
      const key: ComboKey = `${r.grd_cd}|${r.vrty_cd}`;
      if (!comboYms.has(key)) {
        comboYms.set(key, new Set());
        comboMeta.set(key, { grd_cd: r.grd_cd, grd_nm: r.grd_nm, vrty_cd: r.vrty_cd, vrty_nm: r.vrty_nm });
      }
      comboYms.get(key)!.add(r.exmn_ym);
    }

    // coverage >= 3개월 조합만
    const validCombos = [...comboYms.entries()]
      .filter(([, yms]) => yms.size >= 3)
      .map(([key, yms]) => {
        const meta = comboMeta.get(key)!;
        return { ...meta, coverage: yms.size };
      });

    if (validCombos.length <= 1) continue; // 토글 불필요

    // grd_variable: unique grd_cd 수 > 1
    const uniqueGrdCds = [...new Set(validCombos.map(c => c.grd_cd))];
    const grdVariable = uniqueGrdCds.length > 1;

    // vrty_variable: unique vrty_nm 수 > 1 AND item_nm과 다른 vrty_nm 존재
    const uniqueVrtyNms = [...new Set(validCombos.map(c => c.vrty_nm))];
    const vrtyVariable = uniqueVrtyNms.length > 1 && uniqueVrtyNms.some(v => v !== item_nm);

    // 토글할 차원이 없으면 스킵
    if (!grdVariable && !vrtyVariable) continue;

    // grd_cd별 그룹화
    const grdMap = new Map<string, typeof validCombos>();
    for (const c of validCombos) {
      if (!grdMap.has(c.grd_cd)) grdMap.set(c.grd_cd, []);
      grdMap.get(c.grd_cd)!.push(c);
    }

    // default grade: vrty coverage 합계 최대 grd_cd
    const defaultGrdCd = [...grdMap.entries()]
      .sort((a, b) => b[1].reduce((s, c) => s + c.coverage, 0) - a[1].reduce((s, c) => s + c.coverage, 0))[0][0];

    const grades: GradeStats[] = [];

    for (const grd_cd of [...grdMap.keys()].sort()) {
      const combos = grdMap.get(grd_cd)!;
      const grd_label = grdVariable
        ? (GRD_LABEL_MAP[grd_cd] ?? combos[0].grd_nm)
        : '';

      const varieties: VarietyStats[] = [];

      if (vrtyVariable) {
        // 각 vrty_cd별 개별 집계
        const defaultVrtyCd = combos.reduce((best, c) => c.coverage > best.coverage ? c : best).vrty_cd;

        for (const combo of combos) {
          const comboRows = rows.filter(r => r.grd_cd === grd_cd && r.vrty_cd === combo.vrty_cd);
          const monthly = buildMonthly(comboRows);
          if (monthly.length === 0) continue;

          varieties.push({
            vrty_cd: combo.vrty_cd,
            vrty_label: combo.vrty_nm,
            is_default: combo.vrty_cd === defaultVrtyCd,
            coverage: combo.coverage,
            monthly,
          });
        }
      } else {
        // vrty 단일: coverage 최대 vrty_cd 하나만 사용
        const bestCombo = combos.reduce((best, c) => c.coverage > best.coverage ? c : best);
        const comboRows = rows.filter(r => r.grd_cd === grd_cd && r.vrty_cd === bestCombo.vrty_cd);
        const monthly = buildMonthly(comboRows);
        if (monthly.length > 0) {
          varieties.push({
            vrty_cd: bestCombo.vrty_cd,
            vrty_label: '',
            is_default: true,
            coverage: bestCombo.coverage,
            monthly,
          });
        }
      }

      if (varieties.length === 0) continue;

      grades.push({
        grd_cd,
        grd_label,
        is_default: grd_cd === defaultGrdCd,
        varieties,
      });
    }

    // 실질적 토글 가능 여부 재확인
    const totalCombos = grades.reduce((s, g) => s + g.varieties.length, 0);
    if (totalCombos <= 1) continue;

    gradeGroups[item_cd] = { grades };
  }

  fs.writeFileSync(OUT_GRADES_FILE, JSON.stringify(gradeGroups, null, 2), 'utf-8');

  console.log(`\n✅ 저장: ${OUT_GRADES_FILE}`);
  console.log(`   등급 토글 품목: ${Object.keys(gradeGroups).length}개`);
  for (const [item_cd, gg] of Object.entries(gradeGroups)) {
    const row = raw.find(r => r.item_cd === item_cd);
    const item_nm = row?.item_nm ?? item_cd;
    const gradeInfo = gg.grades.map(g =>
      `${g.grd_label || '(단일등급)'}(${g.varieties.map(v => v.vrty_label || '-').join('/')})`
    ).join(' | ');
    console.log(`  ${item_nm}(${item_cd}): ${gradeInfo}`);
  }
}

/** 해당 rows에서 월별 IQR+집계 → MonthlyStats[] */
function buildMonthly(comboRows: PriceItem[]): MonthlyStats[] {
  const allYms = [...new Set(comboRows.map(r => r.exmn_ym))].sort();
  const monthly: MonthlyStats[] = [];

  for (const ym of allYms) {
    const byMonth = comboRows.filter(r => r.exmn_ym === ym);
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

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
