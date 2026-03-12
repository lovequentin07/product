/**
 * src/scripts/update-market-mapping.ts
 * aT(한국농수산식품유통공사) perYearMonth API에서 전체 품목을 자동 수집하여
 * coverage 최대 (vrty_cd, grd_cd) 조합을 선정하고
 * src/data/market-mapping.ts를 자동 생성한다.
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/update-market-mapping.ts
 *
 * 출력: src/data/market-mapping.ts
 *
 * 전체 품목 자동 발견: 카테고리(100~900)별 최근 1개월 조회 → 전체 item_cd 목록 확보
 * coverage = 최근 13개월 중 pmm_avgprc가 비어있지 않은 달 수
 */

import * as fs from 'fs';
import * as path from 'path';

const OUT_FILE = path.join(process.cwd(), 'src/data/market-mapping.ts');

const API_KEY = process.env.DATA_GO_KR_API_KEY;
if (!API_KEY) {
  console.error('DATA_GO_KR_API_KEY 환경변수가 필요합니다');
  process.exit(1);
}

// aT 가격 API 카테고리 코드 전체
const CTGRY_CODES = [
  { cd: '100', nm: '식량작물' },
  { cd: '200', nm: '채소류' },
  { cd: '300', nm: '특용작물' },
  { cd: '400', nm: '과일류' },
  { cd: '500', nm: '축산물' },
  { cd: '600', nm: '수산물' },
  { cd: '800', nm: '식품' },
  { cd: '900', nm: '임산물' },
];

// 최근 N개월 범위 (yyyymm)
function getRecentRange(count: number): { gte: string; lte: string } {
  const now = new Date();
  const lte = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 전월
  const gte = new Date(lte.getFullYear(), lte.getMonth() - (count - 1), 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { gte: fmt(gte), lte: fmt(lte) };
}

// 최근 1개월
function getLastMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface YearMonthItem {
  exmn_ym: string;
  ctgry_cd: string;
  ctgry_nm: string;
  se_cd: string;
  item_cd: string;
  item_nm: string;
  vrty_cd: string;
  grd_cd: string;
  grd_nm: string;
  unit: string;
  unit_sz: string;
  pmm_avgprc: string;
  pmm_hgprc: string;
  pmm_lwprc: string;
}

async function fetchYearMonth(params: Record<string, string>): Promise<YearMonthItem[]> {
  const url = new URL('https://apis.data.go.kr/B552845/perYearMonth/price');
  url.searchParams.set('serviceKey', API_KEY!);
  url.searchParams.set('numOfRows', '1000');
  url.searchParams.set('pageNo', '1');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as {
    response: {
      header: { resultCode: string; resultMsg: string };
      body: {
        totalCount: number;
        items: { item: YearMonthItem | YearMonthItem[] } | null;
      };
    };
  };

  const { resultCode, resultMsg } = data.response.header;
  if (resultCode !== '00' && resultCode !== '0') {
    throw new Error(`API 오류: ${resultCode} ${resultMsg}`);
  }

  const rawItems = data.response.body?.items?.item;
  if (!rawItems) return [];
  return Array.isArray(rawItems) ? rawItems : [rawItems];
}

// ── Step 1: 전체 품목 자동 발견 ──────────────────────────────────────────────
async function discoverAllItems(): Promise<Map<string, { item_nm: string; ctgry_cd: string; ctgry_nm: string }>> {
  const ym = getLastMonth();
  const itemMap = new Map<string, { item_nm: string; ctgry_cd: string; ctgry_nm: string }>();

  console.log(`\n── Step 1: 전체 품목 발견 (기준월: ${ym}) ──`);

  for (const ctgry of CTGRY_CODES) {
    try {
      const items = await fetchYearMonth({
        'cond[ctgry_cd::EQ]': ctgry.cd,
        'cond[exmn_ym::EQ]': ym,
      });

      // se_cd 구분 없이 모든 item_cd 수집 (se_cd 폴백은 Step 2에서 처리)
      for (const it of items) {
        if (!itemMap.has(it.item_cd)) {
          itemMap.set(it.item_cd, {
            item_nm: it.item_nm,
            ctgry_cd: it.ctgry_cd,
            ctgry_nm: it.ctgry_nm,
          });
        }
      }

      const count = new Set(items.map(it => it.item_cd)).size;
      console.log(`  [${ctgry.cd}] ${ctgry.nm}: ${count}개 품목`);
    } catch (err) {
      console.error(`  [${ctgry.cd}] ${ctgry.nm} 오류:`, err);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n전체 발견 품목 수: ${itemMap.size}개`);
  return itemMap;
}

// ── Step 2: item_cd별 coverage 분석 ──────────────────────────────────────────
interface ComboKey { vrty_cd: string; grd_cd: string; grd_nm: string; unit: string; unit_sz: string }

async function analyzeCoverage(item_cd: string, item_nm: string): Promise<{
  vrty_cd: string;
  grd_cd: string;
  grd_nm: string;
  unit: string;
  unit_sz: string;
  se_cd: string;
  coverage: number;
}> {
  const { gte, lte } = getRecentRange(13);

  // se_cd=01 소매 우선
  let items = await fetchYearMonth({
    'cond[item_cd::EQ]': item_cd,
    'cond[se_cd::EQ]': '01',
    'cond[exmn_ym::GTE]': gte,
    'cond[exmn_ym::LTE]': lte,
  });
  let se_cd = '01';

  if (items.length === 0) {
    // se_cd=02 도매 폴백
    items = await fetchYearMonth({
      'cond[item_cd::EQ]': item_cd,
      'cond[se_cd::EQ]': '02',
      'cond[exmn_ym::GTE]': gte,
      'cond[exmn_ym::LTE]': lte,
    });
    se_cd = '02';
    if (items.length === 0) {
      return { vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 };
    }
  }

  // (vrty_cd, grd_cd) 조합별 coverage 집계
  const coverageMap = new Map<string, { key: ComboKey; coverage: number }>();

  for (const it of items) {
    const mapKey = `${it.vrty_cd}|${it.grd_cd}`;
    const hasData = it.pmm_avgprc !== '' && it.pmm_avgprc !== '0';
    const existing = coverageMap.get(mapKey);

    if (!existing) {
      coverageMap.set(mapKey, {
        key: { vrty_cd: it.vrty_cd, grd_cd: it.grd_cd, grd_nm: it.grd_nm, unit: it.unit, unit_sz: it.unit_sz },
        coverage: hasData ? 1 : 0,
      });
    } else if (hasData) {
      existing.coverage++;
    }
  }

  // coverage 최대 조합 선정
  let best = { key: { vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '' }, coverage: -1 };
  for (const entry of coverageMap.values()) {
    if (entry.coverage > best.coverage) best = entry;
  }

  return {
    vrty_cd: best.key.vrty_cd,
    grd_cd: best.key.grd_cd,
    grd_nm: best.key.grd_nm,
    unit: best.key.unit,
    unit_sz: best.key.unit_sz,
    se_cd,
    coverage: best.coverage,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const today = new Date().toISOString().slice(0, 10);

  // Step 1: 전체 품목 발견
  const itemMap = await discoverAllItems();

  // Step 2: coverage 분석
  console.log('\n── Step 2: coverage 분석 (최근 13개월, se=01 우선→02 폴백) ──');

  interface MappingEntry {
    item_cd: string;
    item_nm: string;
    ctgry_cd: string;
    ctgry_nm: string;
    vrty_cd: string;
    grd_cd: string;
    grd_nm: string;
    unit: string;
    unit_sz: string;
    se_cd: string;
    coverage: number;
  }

  const results: MappingEntry[] = [];

  for (const [item_cd, meta] of itemMap) {
    process.stdout.write(`  [${meta.ctgry_cd}/${item_cd}] ${meta.item_nm} ... `);
    try {
      const combo = await analyzeCoverage(item_cd, meta.item_nm);
      const entry: MappingEntry = {
        item_cd,
        item_nm: meta.item_nm,
        ctgry_cd: meta.ctgry_cd,
        ctgry_nm: meta.ctgry_nm,
        ...combo,
      };
      results.push(entry);

      if (combo.coverage === 0) {
        console.log(`⚠️  coverage=0`);
      } else {
        console.log(
          `se=${combo.se_cd} vrty=${combo.vrty_cd} grd=${combo.grd_cd}[${combo.grd_nm}]` +
          ` ${combo.unit_sz}${combo.unit} coverage=${combo.coverage}`
        );
      }
    } catch (err) {
      console.error(`❌ 오류:`, err);
      results.push({
        item_cd, item_nm: meta.item_nm, ctgry_cd: meta.ctgry_cd, ctgry_nm: meta.ctgry_nm,
        vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: -1,
      });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // ── TypeScript 파일 생성 ──────────────────────────────────────────────────
  // 카테고리 → item_cd 순 정렬
  results.sort((a, b) =>
    a.ctgry_cd.localeCompare(b.ctgry_cd) || a.item_cd.localeCompare(b.item_cd)
  );

  const lines: string[] = [
    `// src/data/market-mapping.ts`,
    `// Auto-generated ${today}. Run: npx tsx src/scripts/update-market-mapping.ts`,
    `// 전체 품목 수: ${results.length}개`,
    ``,
    `export interface MarketMapping {`,
    `  item_cd: string`,
    `  item_nm: string`,
    `  ctgry_cd: string`,
    `  ctgry_nm: string`,
    `  vrty_cd: string`,
    `  grd_cd: string`,
    `  grd_nm: string`,
    `  unit: string`,
    `  unit_sz: string`,
    `  se_cd: string // 01=소매, 02=도매(소매 없는 경우)`,
    `  coverage: number // 최근 13개월 중 데이터 있는 달 수`,
    `}`,
    ``,
    `// 키: item_cd (aT 가격 API 품목 코드)`,
    `export const MARKET_MAPPING: Record<string, MarketMapping> = {`,
  ];

  let prevCtgry = '';
  for (const v of results) {
    if (v.ctgry_cd !== prevCtgry) {
      lines.push(`  // [${v.ctgry_cd}] ${v.ctgry_nm}`);
      prevCtgry = v.ctgry_cd;
    }
    const val = [
      `item_cd: '${v.item_cd}'`,
      `item_nm: '${v.item_nm}'`,
      `ctgry_cd: '${v.ctgry_cd}'`,
      `ctgry_nm: '${v.ctgry_nm}'`,
      `vrty_cd: '${v.vrty_cd}'`,
      `grd_cd: '${v.grd_cd}'`,
      `grd_nm: '${v.grd_nm}'`,
      `unit: '${v.unit}'`,
      `unit_sz: '${v.unit_sz}'`,
      `se_cd: '${v.se_cd}'`,
      `coverage: ${v.coverage}`,
    ].join(', ');
    lines.push(`  '${v.item_cd}': { ${val} },`);
  }

  lines.push(`}`);
  lines.push(``,);

  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf-8');

  // ── 검증 ──────────────────────────────────────────────────────────────────
  console.log('\n── 검증 ──');
  let warnings = 0;
  for (const v of results) {
    if (v.coverage <= 0) {
      console.warn(`  ⚠️  [${v.ctgry_cd}] ${v.item_nm}(${v.item_cd}): coverage=${v.coverage}`);
      warnings++;
    }
  }
  if (warnings === 0) console.log('  모든 품목 coverage > 0 ✅');

  // 카테고리별 요약
  console.log('\n── 카테고리별 품목 수 ──');
  const byCtgry: Record<string, { nm: string; count: number; warn: number }> = {};
  for (const v of results) {
    if (!byCtgry[v.ctgry_cd]) byCtgry[v.ctgry_cd] = { nm: v.ctgry_nm, count: 0, warn: 0 };
    byCtgry[v.ctgry_cd].count++;
    if (v.coverage <= 0) byCtgry[v.ctgry_cd].warn++;
  }
  for (const [cd, { nm, count, warn }] of Object.entries(byCtgry).sort((a, b) => a[0].localeCompare(b[0]))) {
    const warnStr = warn > 0 ? ` ⚠️ ${warn}개 coverage=0` : '';
    console.log(`  [${cd}] ${nm}: ${count}개${warnStr}`);
  }

  console.log(`\n총 ${results.length}개 품목 매핑 완료`);
  console.log(`✅ 저장: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('오류:', err);
  process.exit(1);
});
