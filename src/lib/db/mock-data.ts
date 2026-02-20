// src/lib/db/mock-data.ts
// D1 미연결 시 사용하는 Mock 데이터 (UI 개발용)

import { TransactionRow, AptHistoryResult } from './types';

export const MOCK_TRANSACTIONS: TransactionRow[] = [
  { id: 1, apt_nm: '포레나송파', deal_date: '2025-01-15', deal_amount: 145000, deal_amount_billion: 14.5, area_pyeong: 25, price_per_pyeong: 5.8, exclu_use_ar: 84.95, floor: 8, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 15 },
  { id: 2, apt_nm: '헬리오시티', deal_date: '2025-01-12', deal_amount: 172000, deal_amount_billion: 17.2, area_pyeong: 33, price_per_pyeong: 5.2, exclu_use_ar: 110.4, floor: 15, build_year: 2018, umd_nm: '가락동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '55', road_nm: '올림픽로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 12 },
  { id: 3, apt_nm: '잠실엘스', deal_date: '2025-01-10', deal_amount: 210000, deal_amount_billion: 21.0, area_pyeong: 33, price_per_pyeong: 6.4, exclu_use_ar: 110.0, floor: 22, build_year: 2008, umd_nm: '잠실동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '15', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 10 },
  { id: 4, apt_nm: '파크리오', deal_date: '2025-01-08', deal_amount: 190000, deal_amount_billion: 19.0, area_pyeong: 33, price_per_pyeong: 5.76, exclu_use_ar: 114.7, floor: 5, build_year: 2008, umd_nm: '신천동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '7', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 8 },
  { id: 5, apt_nm: '리센츠', deal_date: '2025-01-05', deal_amount: 185000, deal_amount_billion: 18.5, area_pyeong: 33, price_per_pyeong: 5.61, exclu_use_ar: 114.9, floor: 11, build_year: 2008, umd_nm: '잠실동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '6', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 5 },
  { id: 6, apt_nm: '포레나송파', deal_date: '2025-01-03', deal_amount: 100000, deal_amount_billion: 10.0, area_pyeong: 17, price_per_pyeong: 5.88, exclu_use_ar: 59.94, floor: 3, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 3 },
  { id: 7, apt_nm: '잠실주공5단지', deal_date: '2025-01-02', deal_amount: 340000, deal_amount_billion: 34.0, area_pyeong: 40, price_per_pyeong: 8.5, exclu_use_ar: 138.8, floor: 7, build_year: 1988, umd_nm: '잠실동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '1', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 2 },
  { id: 8, apt_nm: '올림픽선수기자촌', deal_date: '2024-12-28', deal_amount: 156000, deal_amount_billion: 15.6, area_pyeong: 38, price_per_pyeong: 4.11, exclu_use_ar: 131.0, floor: 2, build_year: 1988, umd_nm: '방이동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '88', road_nm: null, cdeal_type: '취소', deal_year: 2024, deal_month: 12, deal_day: 28 },
  { id: 9, apt_nm: '위례자이', deal_date: '2025-01-14', deal_amount: 92000, deal_amount_billion: 9.2, area_pyeong: 24, price_per_pyeong: 3.83, exclu_use_ar: 84.84, floor: 9, build_year: 2016, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '200', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 14 },
  { id: 10, apt_nm: '헬리오시티', deal_date: '2025-01-11', deal_amount: 240000, deal_amount_billion: 24.0, area_pyeong: 46, price_per_pyeong: 5.22, exclu_use_ar: 155.2, floor: 30, build_year: 2018, umd_nm: '가락동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '55', road_nm: '올림픽로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 11 },
  { id: 11, apt_nm: '잠실엘스', deal_date: '2025-01-09', deal_amount: 198000, deal_amount_billion: 19.8, area_pyeong: 33, price_per_pyeong: 6.0, exclu_use_ar: 114.8, floor: 18, build_year: 2008, umd_nm: '잠실동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '15', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 9 },
  { id: 12, apt_nm: '송파더샵', deal_date: '2025-01-07', deal_amount: 78000, deal_amount_billion: 7.8, area_pyeong: 20, price_per_pyeong: 3.9, exclu_use_ar: 66.0, floor: 6, build_year: 2015, umd_nm: '문정동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '35', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 7 },
  { id: 13, apt_nm: '가락쌍용', deal_date: '2025-01-06', deal_amount: 42000, deal_amount_billion: 4.2, area_pyeong: 15, price_per_pyeong: 2.8, exclu_use_ar: 49.5, floor: 1, build_year: 1993, umd_nm: '가락동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '66', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 6 },
  { id: 14, apt_nm: '포레나송파', deal_date: '2025-01-04', deal_amount: 148000, deal_amount_billion: 14.8, area_pyeong: 25, price_per_pyeong: 5.92, exclu_use_ar: 84.95, floor: 12, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 4 },
  { id: 15, apt_nm: '파크리오', deal_date: '2025-01-13', deal_amount: 185000, deal_amount_billion: 18.5, area_pyeong: 33, price_per_pyeong: 5.61, exclu_use_ar: 114.7, floor: 20, build_year: 2008, umd_nm: '신천동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '7', road_nm: null, cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 13 },
];

export const MOCK_APT_HISTORY: AptHistoryResult = {
  aptName: '포레나송파',
  sggNm: '송파구',
  umdNm: '위례동',
  buildYear: 2021,
  totalCount: 47,
  monthly: [
    { yearMonth: '2023-02', avgPrice: 118000, avgPricePerPyeong: 4.72, count: 2 },
    { yearMonth: '2023-04', avgPrice: 122000, avgPricePerPyeong: 4.88, count: 3 },
    { yearMonth: '2023-07', avgPrice: 128000, avgPricePerPyeong: 5.12, count: 4 },
    { yearMonth: '2023-09', avgPrice: 131000, avgPricePerPyeong: 5.24, count: 2 },
    { yearMonth: '2023-11', avgPrice: 133000, avgPricePerPyeong: 5.32, count: 3 },
    { yearMonth: '2024-01', avgPrice: 135000, avgPricePerPyeong: 5.4, count: 4 },
    { yearMonth: '2024-03', avgPrice: 138000, avgPricePerPyeong: 5.52, count: 3 },
    { yearMonth: '2024-05', avgPrice: 140000, avgPricePerPyeong: 5.6, count: 5 },
    { yearMonth: '2024-07', avgPrice: 142000, avgPricePerPyeong: 5.68, count: 4 },
    { yearMonth: '2024-09', avgPrice: 143000, avgPricePerPyeong: 5.72, count: 3 },
    { yearMonth: '2024-11', avgPrice: 144000, avgPricePerPyeong: 5.76, count: 4 },
    { yearMonth: '2025-01', avgPrice: 146500, avgPricePerPyeong: 5.86, count: 3 },
  ],
  byArea: [
    { label: '17평대', minPyeong: 15, maxPyeong: 20, count: 8, avgPrice: 100000 },
    { label: '25평대', minPyeong: 20, maxPyeong: 30, count: 28, avgPrice: 146500 },
    { label: '34평대', minPyeong: 30, maxPyeong: 40, count: 11, avgPrice: 192000 },
  ],
  recentTransactions: [
    { id: 1, apt_nm: '포레나송파', deal_date: '2025-01-15', deal_amount: 145000, deal_amount_billion: 14.5, area_pyeong: 25, price_per_pyeong: 5.8, exclu_use_ar: 84.95, floor: 8, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 15 },
    { id: 6, apt_nm: '포레나송파', deal_date: '2025-01-03', deal_amount: 100000, deal_amount_billion: 10.0, area_pyeong: 17, price_per_pyeong: 5.88, exclu_use_ar: 59.94, floor: 3, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 3 },
    { id: 14, apt_nm: '포레나송파', deal_date: '2025-01-04', deal_amount: 148000, deal_amount_billion: 14.8, area_pyeong: 25, price_per_pyeong: 5.92, exclu_use_ar: 84.95, floor: 12, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 4 },
  ],
};
