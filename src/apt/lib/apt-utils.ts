import { TransactionRow } from '@shared/lib/db/types';
import { NormalizedTransaction } from '@apt/types/real-estate';

/**
 * searchParams에서 문자열 혹은 문자열 배열을 입력받아
 * 첫 번째 요소 문자열 혹은 undefined를 반환
 */
export function ensureString(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

/**
 * TransactionRow(DB) → NormalizedTransaction(UI 컴포넌트) 변환
 */
export function toNormalized(row: TransactionRow): NormalizedTransaction {
  return {
    id: String(row.id),
    aptName: row.apt_nm,
    price: row.deal_amount,
    area: row.exclu_use_ar,
    date: row.deal_date,
    address: row.umd_nm,
    floor: row.floor,
    buildYear: row.build_year,
    isCancelled: !!row.cdeal_type,
    sggNm: row.sgg_nm ?? undefined,
  };
}

/**
 * dealYmd(YYYYMM | YYYY | 없음)를 사람이 읽기 좋은 문자열로 변환
 * @param dealYmd - 거래 연월 문자열 (예: '202406', '2024', '' 혹은 undefined)
 * @param fallback - dealYmd가 없을 때 기본값 (기본값: '')
 */
export function formatPeriodLabel(dealYmd?: string, fallback = ''): string {
  if (!dealYmd) return fallback;
  if (dealYmd.length === 6) return `${dealYmd.substring(0, 4)}년 ${dealYmd.substring(4, 6)}월`;
  if (dealYmd.length === 4) return `${dealYmd}년`;
  return '';
}
