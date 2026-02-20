// src/lib/db/transactions.ts
// D1 거래 목록 조회 (현재: Mock / 추후: 실제 D1 쿼리로 교체)

import { TransactionQueryParams, TransactionsResult, TransactionSummary } from './types';
import { MOCK_TRANSACTIONS } from './mock-data';

const DEFAULT_LIMIT = 15;

/**
 * 거래 목록 조회 (Page 1용)
 * D1 연결 후 이 함수 내부만 교체하면 됨
 */
export async function getTransactions(params: TransactionQueryParams): Promise<TransactionsResult> {
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

  // --- Mock: 필터링 ---
  let filtered = [...MOCK_TRANSACTIONS];

  if (apt_nm) {
    filtered = filtered.filter((t) => t.apt_nm.includes(apt_nm));
  }
  if (area_min !== undefined) {
    filtered = filtered.filter((t) => t.area_pyeong >= area_min);
  }
  if (area_max !== undefined) {
    filtered = filtered.filter((t) => t.area_pyeong <= area_max);
  }
  if (price_min !== undefined) {
    filtered = filtered.filter((t) => t.deal_amount_billion >= price_min);
  }
  if (price_max !== undefined) {
    filtered = filtered.filter((t) => t.deal_amount_billion <= price_max);
  }

  // --- Mock: 정렬 ---
  filtered.sort((a, b) => {
    const aVal = a[sort_by as keyof typeof a] as number | string;
    const bVal = b[sort_by as keyof typeof b] as number | string;
    if (aVal < bVal) return sort_order === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort_order === 'asc' ? 1 : -1;
    return 0;
  });

  // --- Mock: 요약 통계 ---
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

  // --- Mock: 페이지네이션 ---
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return { transactions: paginated, totalCount, page, totalPages, summary };
}
