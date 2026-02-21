// src/lib/db/types.ts
// D1 쿼리 파라미터 및 응답 타입 정의

export interface TransactionQueryParams {
  sgg_cd: string;
  deal_ymd: string; // YYYYMM
  apt_nm?: string;
  page?: number;
  limit?: number;
  sort_by?: 'deal_date' | 'deal_amount_billion' | 'price_per_pyeong' | 'area_pyeong' | 'floor' | 'build_year' | 'apt_nm' | 'sgg_nm';
  sort_order?: 'asc' | 'desc';
  area_min?: number; // 평 단위
  area_max?: number;
  price_min?: number; // 억 단위
  price_max?: number;
}

export interface TransactionRow {
  id: number;
  apt_nm: string;
  deal_date: string;        // YYYY-MM-DD
  deal_amount: number;      // 만원
  deal_amount_billion: number; // 억
  area_pyeong: number;      // 평
  price_per_pyeong: number; // 억/평
  exclu_use_ar: number;     // ㎡
  floor: number;
  build_year: number;
  umd_nm: string;
  sgg_nm: string;
  sgg_cd: string;
  jibun: string;
  road_nm: string | null;
  cdeal_type: string | null;
  deal_year: number;
  deal_month: number;
  deal_day: number;
}

export interface TransactionSummary {
  avgPrice: number;       // 만원
  maxPrice: number;
  minPrice: number;
  avgPricePerPyeong: number;
}

export interface TransactionsResult {
  transactions: TransactionRow[];
  totalCount: number;
  page: number;
  totalPages: number;
  summary: TransactionSummary;
}

// Page 2용 타입
export interface MonthlyStats {
  yearMonth: string;       // YYYY-MM
  avgPrice: number;        // 만원
  avgPricePerPyeong: number;
  count: number;
}

export interface AreaStats {
  label: string;           // 예: "25평대"
  minPyeong: number;
  maxPyeong: number;
  count: number;
  avgPrice: number;        // 만원
}

export interface AptHistoryResult {
  aptName: string;
  sggNm: string;
  umdNm: string;
  buildYear: number;
  totalCount: number;
  transactionPage: number;
  transactionTotalPages: number;
  monthly: MonthlyStats[];
  byArea: AreaStats[];
  recentTransactions: TransactionRow[];
}
