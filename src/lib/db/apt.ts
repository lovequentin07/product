// src/lib/db/apt.ts
// 아파트 상세 이력 조회 (Page 2용)

import { AptHistoryResult, MonthlyStats, AreaStats, TransactionRow } from './types';
import { MOCK_APT_HISTORY } from './mock-data';

// -------------------------
// Mock 폴백 (로컬 개발용)
// -------------------------
function getMockAptHistory(apt_nm: string): AptHistoryResult {
  return {
    ...MOCK_APT_HISTORY,
    aptName: decodeURIComponent(apt_nm),
  };
}

// -------------------------
// D1 쿼리
// -------------------------
async function getD1AptHistory(
  db: D1Database,
  sgg_cd: string,
  apt_nm: string,
  months: number
): Promise<AptHistoryResult | null> {
  const decodedAptNm = decodeURIComponent(apt_nm);

  // 기준 날짜: months개월 전
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceDate = since.toISOString().slice(0, 10); // YYYY-MM-DD

  const conditions = ['apt_nm = ?', 'deal_date >= ?'];
  const bindings: (string | number)[] = [decodedAptNm, sinceDate];

  if (sgg_cd && sgg_cd !== '11000') {
    conditions.push('sgg_cd = ?');
    bindings.push(sgg_cd);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // 기본 정보 + 집계
  const metaStmt = db
    .prepare(
      `SELECT sgg_nm, umd_nm, build_year, COUNT(*) as total_count FROM transactions ${where} LIMIT 1`
    )
    .bind(...bindings);

  // 월별 집계
  const monthlyStmt = db
    .prepare(
      `SELECT deal_year || '-' || printf('%02d', deal_month) as year_month, AVG(deal_amount) as avg_price, AVG(price_per_pyeong) as avg_ppp, COUNT(*) as cnt FROM transactions ${where} GROUP BY deal_year, deal_month ORDER BY deal_year DESC, deal_month DESC`
    )
    .bind(...bindings);

  // 평형별 집계 (10평 단위 버킷)
  const areaStmt = db
    .prepare(
      `SELECT (area_pyeong / 10) * 10 as bucket, COUNT(*) as cnt, AVG(deal_amount) as avg_price FROM transactions ${where} GROUP BY bucket ORDER BY bucket`
    )
    .bind(...bindings);

  // 최근 거래 20건
  const recentStmt = db
    .prepare(
      `SELECT id, apt_nm, deal_date, deal_amount, deal_amount_billion, area_pyeong, price_per_pyeong, exclu_use_ar, floor, build_year, umd_nm, sgg_nm, sgg_cd, jibun, road_nm, cdeal_type, deal_year, deal_month, deal_day FROM transactions ${where} ORDER BY deal_date DESC LIMIT 20`
    )
    .bind(...bindings);

  const [metaRow, monthlyResult, areaResult, recentResult] = await Promise.all([
    metaStmt.first<{ sgg_nm: string; umd_nm: string; build_year: number; total_count: number }>(),
    monthlyStmt.all<{ year_month: string; avg_price: number; avg_ppp: number; cnt: number }>(),
    areaStmt.all<{ bucket: number; cnt: number; avg_price: number }>(),
    recentStmt.all<TransactionRow>(),
  ]);

  if (!metaRow) return null;

  const monthly: MonthlyStats[] = (monthlyResult.results ?? []).map((r) => ({
    yearMonth: r.year_month,
    avgPrice: Math.round(r.avg_price),
    avgPricePerPyeong: Math.round(r.avg_ppp * 100) / 100,
    count: r.cnt,
  }));

  const byArea: AreaStats[] = (areaResult.results ?? []).map((r) => {
    const min = r.bucket;
    const max = r.bucket + 9;
    return {
      label: `${min}평대`,
      minPyeong: min,
      maxPyeong: max,
      count: r.cnt,
      avgPrice: Math.round(r.avg_price),
    };
  });

  return {
    aptName: decodedAptNm,
    sggNm: metaRow.sgg_nm ?? '',
    umdNm: metaRow.umd_nm ?? '',
    buildYear: metaRow.build_year ?? 0,
    totalCount: metaRow.total_count ?? 0,
    monthly,
    byArea,
    recentTransactions: recentResult.results ?? [],
  };
}

// -------------------------
// 공개 API (함수 시그니처 불변)
// -------------------------
export async function getAptHistory(
  sgg_cd: string,
  apt_nm: string,
  months: number = 24
): Promise<AptHistoryResult | null> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) return getMockAptHistory(apt_nm);

  return getD1AptHistory(db, sgg_cd, apt_nm, months);
}
