/**
 * src/scripts/analyze-market-daily.ts
 * market-prices-daily-raw.json + market-stats.json → 할인율 계산
 *
 * 사용법: npx tsx src/scripts/analyze-market-daily.ts
 * 출력: src/data/market-daily-stats.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DAILY_FILE = path.join(process.cwd(), 'src/data/market-prices-daily-raw.json');
const STATS_FILE = path.join(process.cwd(), 'src/data/market-stats.json');
const OUT_FILE = path.join(process.cwd(), 'src/data/market-daily-stats.json');

interface DailyRaw {
  item_cd: string;
  item_nm: string;
  ctgry_cd: string;
  exmn_ymd: string;
  se_cd: string;
  latest_price: number;
  unit: string;
  unit_sz: string;
  days_ago: number;
  raw_count: number;
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
}

interface DailyStats {
  item_cd: string;
  item_nm: string;
  ctgry_cd: string;
  ctgry_nm: string;
  exmn_ymd: string;
  latest_price: number;
  unit: string;
  unit_sz: string;
  days_ago: number;
  avg_avg_price: number;
  all_time_high: number;
  all_time_low: number;
  vs_avg_rate: number;   // (최신가 - avg_avg_price) / avg_avg_price × 100, 음수=평균보다 저렴
  range_pct: number;     // (최신가 - all_time_low) / (all_time_high - all_time_low) × 100, 0%=역대최저, 100%=역대최고
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

async function main() {
  if (!fs.existsSync(DAILY_FILE)) {
    console.error(`파일 없음: ${DAILY_FILE}`);
    console.error('먼저 fetch-market-daily.ts를 실행하세요.');
    process.exit(1);
  }

  const daily: DailyRaw[] = JSON.parse(fs.readFileSync(DAILY_FILE, 'utf-8'));
  const statsArr: ItemStats[] = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));

  // item_nm 기준 stats 맵 (analyze-market-prices.ts가 item_nm 키로 저장)
  const statsMap = new Map<string, ItemStats>();
  for (const s of statsArr) {
    statsMap.set(s.item_nm, s);
    statsMap.set(s.item_cd, s); // item_cd 보조 키
  }

  const results: DailyStats[] = [];
  let matched = 0;
  let unmatched = 0;

  for (const d of daily) {
    // item_nm 우선 매칭, 없으면 item_cd
    const stat = statsMap.get(d.item_nm) ?? statsMap.get(d.item_cd);

    if (!stat) {
      console.warn(`  [unmatched] ${d.item_nm}(${d.item_cd}) — market-stats.json에 없음`);
      unmatched++;
      continue;
    }

    if (stat.avg_avg_price === 0 || stat.all_time_high === stat.all_time_low) {
      console.warn(`  [skip] ${d.item_nm}(${d.item_cd}) — 통계 데이터 부족`);
      unmatched++;
      continue;
    }

    const vs_avg_rate = round1(
      (d.latest_price - stat.avg_avg_price) / stat.avg_avg_price * 100
    );
    const range_pct = round1(
      (d.latest_price - stat.all_time_low) / (stat.all_time_high - stat.all_time_low) * 100
    );
    results.push({
      item_cd: d.item_cd,
      item_nm: d.item_nm,
      ctgry_cd: d.ctgry_cd,
      ctgry_nm: stat.ctgry_nm,
      exmn_ymd: d.exmn_ymd,
      latest_price: d.latest_price,
      unit: d.unit || stat.unit,
      unit_sz: d.unit_sz || stat.unit_sz,
      days_ago: d.days_ago,
      avg_avg_price: stat.avg_avg_price,
      all_time_high: stat.all_time_high,
      all_time_low: stat.all_time_low,
      vs_avg_rate,
      range_pct,
    });
    matched++;
  }

  // vs_avg_rate 오름차순 (저렴한 순)
  results.sort((a, b) => a.vs_avg_rate - b.vs_avg_rate);

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  // 요약 출력
  console.log(`\n✅ 저장: ${OUT_FILE}`);
  console.log(`   전체: ${results.length}개 / 매칭실패: ${unmatched}개\n`);

  // 상위 10개 저렴 품목 출력
  console.log('--- 저렴 상위 10개 (vs_avg_rate 낮은 순) ---');
  for (const r of results.slice(0, 10)) {
    console.log(
      `  ${r.item_nm}(${r.item_cd})  ` +
      `최신=${r.latest_price.toLocaleString()}${r.unit_sz}${r.unit}  ` +
      `평균대비=${r.vs_avg_rate > 0 ? '+' : ''}${r.vs_avg_rate}%  ` +
      `range=${r.range_pct}%  ` +
      `D-${r.days_ago}`
    );
  }

  // vs_avg_rate 극단값 체크
  const extremes = results.filter(r => Math.abs(r.vs_avg_rate) > 50);
  if (extremes.length > 0) {
    console.log(`\n⚠️  vs_avg_rate ±50% 초과 품목 (${extremes.length}개):`);
    for (const r of extremes) {
      console.log(
        `  ${r.item_nm}  vs_avg=${r.vs_avg_rate}%  ` +
        `최신=${r.latest_price}  평균=${r.avg_avg_price}`
      );
    }
  }
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
