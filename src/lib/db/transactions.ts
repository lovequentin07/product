// src/lib/db/transactions.ts
// D1 거래 목록 조회

import { TransactionQueryParams, TransactionsResult, TransactionSummary, TransactionRow } from './types';
import { MOCK_TRANSACTIONS } from './mock-data';

const DEFAULT_LIMIT = 15;

// -------------------------
// Mock 폴백 (로컬 개발용)
// -------------------------
function getMockTransactions(params: TransactionQueryParams): TransactionsResult {
  const {
    apt_nm,
    page = 1,
    limit = DEFAULT_LIMIT,
    sort_by = 'deal_date',
    sort_order = 'desc',
    area_min,
    area_max,
    price_min,
    price_max,
  } = params;

  let filtered = [...MOCK_TRANSACTIONS];

  if (params.sgg_cd && params.sgg_cd !== '11000') {
    filtered = filtered.filter((t) => t.sgg_cd === params.sgg_cd);
  }

  const { deal_ymd } = params;
  if (deal_ymd && deal_ymd.length === 6) {
    const year = parseInt(deal_ymd.substring(0, 4), 10);
    const month = parseInt(deal_ymd.substring(4, 6), 10);
    filtered = filtered.filter((t) => t.deal_year === year && t.deal_month === month);
  } else if (deal_ymd && deal_ymd.length === 4) {
    const year = parseInt(deal_ymd, 10);
    filtered = filtered.filter((t) => t.deal_year === year);
  }

  if (apt_nm) filtered = filtered.filter((t) => t.apt_nm.includes(apt_nm));
  if (area_min !== undefined) filtered = filtered.filter((t) => t.area_pyeong >= area_min);
  if (area_max !== undefined) filtered = filtered.filter((t) => t.area_pyeong <= area_max);
  if (price_min !== undefined) filtered = filtered.filter((t) => t.deal_amount_billion >= price_min);
  if (price_max !== undefined) filtered = filtered.filter((t) => t.deal_amount_billion <= price_max);

  filtered.sort((a, b) => {
    const aVal = a[sort_by as keyof typeof a] as number | string;
    const bVal = b[sort_by as keyof typeof b] as number | string;
    if (aVal < bVal) return sort_order === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort_order === 'asc' ? 1 : -1;
    return 0;
  });

  const summary: TransactionSummary =
    filtered.length === 0
      ? { avgPrice: 0, maxPrice: 0, minPrice: 0, avgPricePerPyeong: 0 }
      : {
          avgPrice: Math.round(filtered.reduce((s, t) => s + t.deal_amount, 0) / filtered.length),
          maxPrice: Math.max(...filtered.map((t) => t.deal_amount)),
          minPrice: Math.min(...filtered.map((t) => t.deal_amount)),
          avgPricePerPyeong:
            Math.round((filtered.reduce((s, t) => s + t.price_per_pyeong, 0) / filtered.length) * 100) / 100,
        };

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return { transactions: paginated, totalCount, page, totalPages, summary };
}

// -------------------------
// D1 쿼리
// -------------------------
async function getD1Transactions(db: D1Database, params: TransactionQueryParams): Promise<TransactionsResult> {
  const {
    sgg_cd,
    deal_ymd,
    apt_nm,
    page = 1,
    limit = DEFAULT_LIMIT,
    sort_by = 'deal_date',
    sort_order = 'desc',
    area_min,
    area_max,
    price_min,
    price_max,
  } = params;

  // 허용된 정렬 컬럼만 통과 (SQL 인젝션 방지)
  const ALLOWED_SORT = new Set(['deal_date', 'deal_amount_billion', 'price_per_pyeong', 'area_pyeong', 'floor', 'build_year', 'apt_nm', 'sgg_nm']);
  const safeSort = ALLOWED_SORT.has(sort_by) ? sort_by : 'deal_date';
  const safeOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  // 지역 필터 (서울 전체 = '11000'이면 생략)
  if (sgg_cd && sgg_cd !== '11000') {
    conditions.push('sgg_cd = ?');
    bindings.push(sgg_cd);
  }

  // 날짜 필터
  if (deal_ymd && deal_ymd.length === 6) {
    conditions.push('deal_year = ? AND deal_month = ?');
    bindings.push(parseInt(deal_ymd.substring(0, 4), 10));
    bindings.push(parseInt(deal_ymd.substring(4, 6), 10));
  } else if (deal_ymd && deal_ymd.length === 4) {
    conditions.push('deal_year = ?');
    bindings.push(parseInt(deal_ymd, 10));
  }

  // 아파트명 검색
  if (apt_nm) {
    conditions.push('apt_nm LIKE ?');
    bindings.push(`%${apt_nm}%`);
  }

  // 면적·가격 필터
  if (area_min !== undefined) { conditions.push('area_pyeong >= ?'); bindings.push(area_min); }
  if (area_max !== undefined) { conditions.push('area_pyeong <= ?'); bindings.push(area_max); }
  if (price_min !== undefined) { conditions.push('deal_amount_billion >= ?'); bindings.push(price_min); }
  if (price_max !== undefined) { conditions.push('deal_amount_billion <= ?'); bindings.push(price_max); }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 단일 쿼리: window function으로 집계+목록 동시 조회 (전체 스캔 2회 → 1회)
  const offset = (page - 1) * limit;
  const sql = `
    SELECT
      id, apt_nm, deal_date, deal_amount, deal_amount_billion,
      area_pyeong, price_per_pyeong, exclu_use_ar, floor, build_year,
      umd_nm, sgg_nm, sgg_cd, jibun, road_nm, cdeal_type,
      deal_year, deal_month, deal_day,
      COUNT(*) OVER() AS w_cnt,
      AVG(deal_amount) OVER() AS w_avg,
      MAX(deal_amount) OVER() AS w_max,
      MIN(deal_amount) OVER() AS w_min,
      AVG(price_per_pyeong) OVER() AS w_avg_ppp
    FROM transactions
    ${whereClause}
    ORDER BY ${safeSort} ${safeOrder}
    LIMIT ? OFFSET ?
  `;

  type TransactionWithWindow = TransactionRow & {
    w_cnt: number;
    w_avg: number;
    w_max: number;
    w_min: number;
    w_avg_ppp: number;
  };

  let result: D1Result<TransactionWithWindow>;
  try {
    result = await db.prepare(sql).bind(...bindings, limit, offset).all<TransactionWithWindow>();
  } catch (e) {
    throw new Error(`D1 query failed: ${(e as Error).message}`);
  }

  const first = result.results[0];
  const totalCount = first?.w_cnt ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const summary: TransactionSummary = {
    avgPrice: Math.round(first?.w_avg ?? 0),
    maxPrice: first?.w_max ?? 0,
    minPrice: first?.w_min ?? 0,
    avgPricePerPyeong: Math.round((first?.w_avg_ppp ?? 0) * 100) / 100,
  };

  return {
    transactions: result.results ?? [],
    totalCount,
    page,
    totalPages,
    summary,
  };
}

// -------------------------
// 공개 API (함수 시그니처 불변)
// -------------------------
export async function getTransactions(params: TransactionQueryParams): Promise<TransactionsResult> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경 — getCloudflareContext 불가
  }

  if (!db) return getMockTransactions(params);

  return getD1Transactions(db, params);
}
