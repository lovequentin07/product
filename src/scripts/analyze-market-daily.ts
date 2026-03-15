/**
 * src/scripts/analyze-market-daily.ts
 * market-prices-daily-raw.json + market-stats.json → 할인율 계산
 *
 * 사용법: npx tsx src/scripts/analyze-market-daily.ts
 * 출력: src/data/market-daily-stats.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { MARKET_MAPPING } from '../data/market-mapping';

const DAILY_FILE = path.join(process.cwd(), 'src/data/market-prices-daily-raw.json');
const STATS_FILE = path.join(process.cwd(), 'src/data/market-stats.json');
const GRADES_FILE = path.join(process.cwd(), 'src/data/market-stats-grades.json');
const OUT_FILE = path.join(process.cwd(), 'src/data/market-daily-stats.json');

// ----------------------------------------------------------------
// 수산물 신선도 정규화 (analyze-market-prices.ts와 동일)
// ----------------------------------------------------------------
const FRESHNESS_MAP: Record<string, string> = {
  '생선': '신선',
  '냉장': '신선',
  '신선냉장': '신선',
  '국산(신선 냉장)': '신선',
  '국산(냉장)': '신선',
  '연근해(신선 냉장)': '신선',
  '참조기(신선 냉장)': '신선',
  '냉동': '냉동',
  '국산(냉동)': '냉동',
  '원양(냉동)': '냉동',
  '연근해(냉동)': '냉동',
  '국산(냉동,원양)': '냉동',
  '냉동(원양수입통합)': '냉동',
  '냉동가공': '냉동',
  '수입산(냉동)': '냉동',
  '참조기(냉동)': '냉동',
  '염장': '염장',
  '수입산(염장)': '염장',
  '국산(염장)': '염장',
};

// grd_cd → 라벨
const GRD_LABEL_MAP: Record<string, string> = {
  '20': '대',
  '21': '중',
  '22': '소',
  '27': '대멸',
  '28': '중멸',
  '29': '세멸',
};

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
  se_cd?: string;
  all_time_high: number;
  all_time_low: number;
  avg_avg_price: number;
  data_count: number;
  monthly: Array<{ ym: string; high: number; low: number; avg: number }>;
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
  se_cd: string;         // '01'=소매, '02'=도매
  grd_cd?: string;       // 등급 코드 (grade group 있는 품목, 최적 조합)
  grd_label?: string;    // 등급 라벨 (大→대, 中→중 등)
  vrty_cd?: string;      // 신선도 코드 (grade group 있는 품목, 최적 조합)
  vrty_label?: string;   // 신선도 라벨 (신선/냉동/염장)
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

  // market-stats-grades.json 로드 (있으면)
  interface GradeVariety {
    vrty_cd: string;
    vrty_label: string;
    is_default: boolean;
    coverage: number;
    monthly: Array<{ ym: string; high: number; low: number; avg: number }>;
  }
  interface GradeEntry {
    grd_cd: string;
    grd_label: string;
    is_default: boolean;
    varieties: GradeVariety[];
  }
  interface GradeGroup {
    grades: GradeEntry[];
  }
  const gradeGroups: Record<string, GradeGroup> = fs.existsSync(GRADES_FILE)
    ? JSON.parse(fs.readFileSync(GRADES_FILE, 'utf-8'))
    : {};

  // item_cd → 최적 조합(range_pct 최소) 맵 구성
  interface BestCombo {
    grd_cd: string;
    grd_label: string;
    vrty_cd: string;
    vrty_label: string;
    latest_price: number;
    all_time_high: number;
    all_time_low: number;
    avg_avg_price: number;
    range_pct: number;
    vs_avg_rate: number;
  }
  const bestComboMap = new Map<string, BestCombo>();

  for (const [item_cd, gg] of Object.entries(gradeGroups)) {
    let best: BestCombo | null = null;

    for (const grade of gg.grades) {
      for (const vrty of grade.varieties) {
        const monthly = vrty.monthly ?? [];
        if (monthly.length === 0) continue;

        const latest_price = monthly[monthly.length - 1].avg;
        const all_time_high = Math.max(...monthly.map(m => m.high));
        const all_time_low = Math.min(...monthly.map(m => m.low));
        const avgs = monthly.map(m => m.avg);
        const avg_avg_price = avgs.reduce((s, v) => s + v, 0) / avgs.length;

        if (all_time_high === all_time_low) continue;

        const range_pct = round1(
          (latest_price - all_time_low) / (all_time_high - all_time_low) * 100
        );
        const vs_avg_rate = round1(
          (latest_price - avg_avg_price) / avg_avg_price * 100
        );

        if (best === null || range_pct < best.range_pct) {
          best = {
            grd_cd: grade.grd_cd,
            grd_label: grade.grd_label,
            vrty_cd: vrty.vrty_cd,
            vrty_label: vrty.vrty_label,
            latest_price,
            all_time_high,
            all_time_low,
            avg_avg_price,
            range_pct,
            vs_avg_rate,
          };
        }
      }
    }

    if (best) {
      bestComboMap.set(item_cd, best);
    }
  }

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
    // grade group 품목: bestComboMap에서 최적 조합을 직접 사용
    const bestCombo = bestComboMap.get(d.item_cd);
    if (bestCombo) {
      const stat = statsMap.get(d.item_nm) ?? statsMap.get(d.item_cd);
      results.push({
        item_cd: d.item_cd,
        item_nm: d.item_nm,
        ctgry_cd: d.ctgry_cd,
        ctgry_nm: stat?.ctgry_nm ?? '',
        exmn_ymd: d.exmn_ymd,
        latest_price: bestCombo.latest_price,
        unit: d.unit || stat?.unit || '',
        unit_sz: d.unit_sz || stat?.unit_sz || '',
        days_ago: d.days_ago,
        avg_avg_price: bestCombo.avg_avg_price,
        all_time_high: bestCombo.all_time_high,
        all_time_low: bestCombo.all_time_low,
        vs_avg_rate: bestCombo.vs_avg_rate,
        range_pct: bestCombo.range_pct,
        se_cd: '01', // grade group 가격은 항상 소매 기준 (market-stats-grades.json)
        grd_cd: bestCombo.grd_cd,
        grd_label: bestCombo.grd_label,
        vrty_cd: bestCombo.vrty_cd,
        vrty_label: bestCombo.vrty_label,
      });
      matched++;
      continue;
    }

    // grade group 없는 품목: 기존 로직
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

    // 도매 품목: daily raw는 소매 se_cd로 수집되므로 단위 불일치 발생
    // → market-stats.json의 마지막 월 평균을 latest_price로 사용
    const isWholesale = stat.se_cd === '02';
    const latestMonthly = stat.monthly.length > 0
      ? stat.monthly[stat.monthly.length - 1]
      : null;
    const latest_price = isWholesale && latestMonthly
      ? latestMonthly.avg
      : d.latest_price;
    const unit = isWholesale ? stat.unit : (d.unit || stat.unit);
    const unit_sz = isWholesale ? stat.unit_sz : (d.unit_sz || stat.unit_sz);

    const vs_avg_rate = round1(
      (latest_price - stat.avg_avg_price) / stat.avg_avg_price * 100
    );
    const range_pct = round1(
      (latest_price - stat.all_time_low) / (stat.all_time_high - stat.all_time_low) * 100
    );
    // grd_label: grades 파일에 없는 품목은 mapping 기준
    const mapping = MARKET_MAPPING[d.item_cd];
    const grd_label = mapping?.grd_cd
      ? (GRD_LABEL_MAP[mapping.grd_cd] ?? mapping.grd_nm)
      : undefined;

    results.push({
      item_cd: d.item_cd,
      item_nm: d.item_nm,
      ctgry_cd: d.ctgry_cd,
      ctgry_nm: stat.ctgry_nm,
      exmn_ymd: d.exmn_ymd,
      latest_price,
      unit,
      unit_sz,
      days_ago: d.days_ago,
      avg_avg_price: stat.avg_avg_price,
      all_time_high: stat.all_time_high,
      all_time_low: stat.all_time_low,
      vs_avg_rate,
      range_pct,
      se_cd: stat.se_cd ?? '01',
      ...(grd_label !== undefined && { grd_label }),
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
