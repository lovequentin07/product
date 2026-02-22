// src/lib/db/apt.ts
// 아파트 상세 이력 조회 (Page 2용)

import { AptHistoryResult, MonthlyStats, AreaStats, TransactionRow } from './types';
import { MOCK_APT_HISTORY, MOCK_TRANSACTIONS } from './mock-data';

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
const VALID_SORT_COLS = new Set([
  'deal_date', 'deal_amount_billion', 'price_per_pyeong', 'area_pyeong', 'floor', 'build_year',
]);

async function getD1AptHistory(
  db: D1Database,
  sgg_cd: string,
  apt_nm: string,
  page: number,
  numOfRows: number,
  sortBy: string,
  sortDir: 'asc' | 'desc',
  areaBucket?: number
): Promise<AptHistoryResult | null> {
  const decodedAptNm = decodeURIComponent(apt_nm);

  // 기본 조건 (byArea 탭 목록은 항상 전체 표시)
  const baseConditions = ['apt_nm = ?'];
  const baseBindings: (string | number)[] = [decodedAptNm];
  if (sgg_cd && sgg_cd !== '11000') {
    baseConditions.push('sgg_cd = ?');
    baseBindings.push(sgg_cd);
  }

  // 필터 조건 (areaBucket 적용 — meta, monthly, 거래 목록에 사용)
  const filteredConditions = [...baseConditions];
  const filteredBindings = [...baseBindings];
  if (areaBucket !== undefined) {
    filteredConditions.push('(area_pyeong / 10) * 10 = ?');
    filteredBindings.push(areaBucket);
  }

  const baseWhere = `WHERE ${baseConditions.join(' AND ')}`;
  const filteredWhere = `WHERE ${filteredConditions.join(' AND ')}`;
  const safeSortBy = VALID_SORT_COLS.has(sortBy) ? sortBy : 'deal_date';
  const safeSortDir = sortDir === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * numOfRows;

  // 기본 정보 + 필터된 건수
  const metaStmt = db
    .prepare(
      `SELECT sgg_nm, umd_nm, build_year, COUNT(*) as total_count FROM transactions ${filteredWhere} LIMIT 1`
    )
    .bind(...filteredBindings);

  // 월별 집계 (areaBucket 필터 적용)
  const monthlyStmt = db
    .prepare(
      `SELECT deal_year || '-' || printf('%02d', deal_month) as year_month, AVG(deal_amount) as avg_price, AVG(price_per_pyeong) as avg_ppp, COUNT(*) as cnt FROM transactions ${filteredWhere} GROUP BY deal_year, deal_month ORDER BY deal_year DESC, deal_month DESC`
    )
    .bind(...filteredBindings);

  // 평형별 집계 — 항상 전체 평형 표시 (탭 목록이 사라지지 않도록)
  const areaStmt = db
    .prepare(
      `SELECT (area_pyeong / 10) * 10 as bucket, COUNT(*) as cnt, AVG(deal_amount) as avg_price FROM transactions ${baseWhere} GROUP BY bucket ORDER BY bucket`
    )
    .bind(...baseBindings);

  // 페이지네이션된 거래 목록 (areaBucket 필터 적용)
  const recentStmt = db
    .prepare(
      `SELECT id, apt_nm, deal_date, deal_amount, deal_amount_billion, area_pyeong, price_per_pyeong, exclu_use_ar, floor, build_year, umd_nm, sgg_nm, sgg_cd, jibun, road_nm, cdeal_type, deal_year, deal_month, deal_day FROM transactions ${filteredWhere} ORDER BY ${safeSortBy} ${safeSortDir} LIMIT ? OFFSET ?`
    )
    .bind(...filteredBindings, numOfRows, offset);

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
      label: min === 0 ? '10평 미만' : `${min}평대`,
      minPyeong: min,
      maxPyeong: max,
      count: r.cnt,
      avgPrice: Math.round(r.avg_price),
    };
  });

  const totalCount = metaRow.total_count ?? 0;

  return {
    aptName: decodedAptNm,
    sggNm: metaRow.sgg_nm ?? '',
    umdNm: metaRow.umd_nm ?? '',
    buildYear: metaRow.build_year ?? 0,
    totalCount,
    transactionPage: page,
    transactionTotalPages: Math.max(1, Math.ceil(totalCount / numOfRows)),
    monthly,
    byArea,
    recentTransactions: recentResult.results ?? [],
  };
}

// -------------------------
// 공개 API (함수 시그니처 불변)
// -------------------------
export async function getLatestDealDate(): Promise<Date> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) return new Date('2026-02-20');

  const row = await db
    .prepare('SELECT MAX(deal_date) as latest FROM transactions')
    .first<{ latest: string }>();

  return row?.latest ? new Date(row.latest) : new Date();
}

export interface RegionApartmentStat {
  apt_nm: string;
  umd_nm: string;
  total_count: number;
  avg_billion: number;
  latest_date: string;
}

export async function getRegionApartmentStats(sgg_cd: string): Promise<RegionApartmentStat[]> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    const grouped = new Map<string, { umd_nm: string; count: number; totalBillion: number; latest: string }>();
    for (const r of MOCK_TRANSACTIONS.filter(row => row.sgg_cd === sgg_cd)) {
      const existing = grouped.get(r.apt_nm);
      if (!existing) {
        grouped.set(r.apt_nm, { umd_nm: r.umd_nm, count: 1, totalBillion: r.deal_amount_billion, latest: r.deal_date });
      } else {
        existing.count++;
        existing.totalBillion += r.deal_amount_billion;
        if (r.deal_date > existing.latest) existing.latest = r.deal_date;
      }
    }
    return Array.from(grouped.entries())
      .map(([apt_nm, v]) => ({
        apt_nm,
        umd_nm: v.umd_nm,
        total_count: v.count,
        avg_billion: Math.round(v.totalBillion / v.count * 10) / 10,
        latest_date: v.latest,
      }))
      .sort((a, b) => b.total_count - a.total_count);
  }

  const result = await db
    .prepare(
      `SELECT apt_nm, umd_nm, COUNT(*) as total_count,
              ROUND(AVG(deal_amount_billion), 1) as avg_billion,
              MAX(deal_date) as latest_date
       FROM transactions
       WHERE sgg_cd = ?
       GROUP BY apt_nm
       ORDER BY total_count DESC
       LIMIT 300`
    )
    .bind(sgg_cd)
    .all<RegionApartmentStat>();

  return result.results ?? [];
}

export async function getDistinctApartments(): Promise<{ sgg_cd: string; sgg_nm: string; apt_nm: string }[]> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    const seen = new Set<string>();
    return MOCK_TRANSACTIONS.reduce<{ sgg_cd: string; sgg_nm: string; apt_nm: string }[]>((acc, row) => {
      const key = `${row.sgg_cd}|${row.apt_nm}`;
      if (!seen.has(key)) {
        seen.add(key);
        acc.push({ sgg_cd: row.sgg_cd, sgg_nm: row.sgg_nm ?? '', apt_nm: row.apt_nm });
      }
      return acc;
    }, []);
  }

  const result = await db
    .prepare('SELECT DISTINCT sgg_cd, sgg_nm, apt_nm FROM transactions ORDER BY sgg_cd, apt_nm')
    .all<{ sgg_cd: string; sgg_nm: string; apt_nm: string }>();

  return result.results ?? [];
}

export async function getAptHistory(
  sgg_cd: string,
  apt_nm: string,
  options: {
    page?: number;
    numOfRows?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    areaBucket?: number;
  } = {}
): Promise<AptHistoryResult | null> {
  const { page = 1, numOfRows = 20, sortBy = 'deal_date', sortDir = 'desc', areaBucket } = options;

  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) return getMockAptHistory(apt_nm);

  return getD1AptHistory(db, sgg_cd, apt_nm, page, numOfRows, sortBy, sortDir, areaBucket);
}
