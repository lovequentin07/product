// src/lib/db/mock-data.ts
// D1 미연결 시 사용하는 Mock 데이터 — 여러 구 포함 (전체 조회 테스트용)

import { TransactionRow, AptHistoryResult } from './types';

export const MOCK_TRANSACTIONS: TransactionRow[] = [
  // 송파구
  { id: 1,  apt_nm: '포레나송파',       deal_date: '2025-01-15', deal_amount: 145000, deal_amount_billion: 14.5, area_pyeong: 25, price_per_pyeong: 5.80, exclu_use_ar: 84.95,  floor: 8,  build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 15 },
  { id: 2,  apt_nm: '헬리오시티',       deal_date: '2025-01-12', deal_amount: 172000, deal_amount_billion: 17.2, area_pyeong: 33, price_per_pyeong: 5.21, exclu_use_ar: 110.4,  floor: 15, build_year: 2018, umd_nm: '가락동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '55',  road_nm: '올림픽로',   cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 12 },
  { id: 3,  apt_nm: '잠실엘스',         deal_date: '2025-01-10', deal_amount: 210000, deal_amount_billion: 21.0, area_pyeong: 33, price_per_pyeong: 6.36, exclu_use_ar: 110.0,  floor: 22, build_year: 2008, umd_nm: '잠실동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '15',  road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 10 },
  { id: 4,  apt_nm: '파크리오',         deal_date: '2025-01-08', deal_amount: 190000, deal_amount_billion: 19.0, area_pyeong: 33, price_per_pyeong: 5.76, exclu_use_ar: 114.7,  floor: 5,  build_year: 2008, umd_nm: '신천동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '7',   road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 8  },
  { id: 5,  apt_nm: '잠실주공5단지',    deal_date: '2025-01-02', deal_amount: 340000, deal_amount_billion: 34.0, area_pyeong: 40, price_per_pyeong: 8.50, exclu_use_ar: 138.8,  floor: 7,  build_year: 1988, umd_nm: '잠실동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '1',   road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 2  },
  { id: 6,  apt_nm: '포레나송파',       deal_date: '2025-01-04', deal_amount: 148000, deal_amount_billion: 14.8, area_pyeong: 25, price_per_pyeong: 5.92, exclu_use_ar: 84.95,  floor: 12, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 4  },

  // 강남구
  { id: 7,  apt_nm: '래미안대치팰리스', deal_date: '2025-01-14', deal_amount: 380000, deal_amount_billion: 38.0, area_pyeong: 40, price_per_pyeong: 9.50, exclu_use_ar: 133.3,  floor: 18, build_year: 2015, umd_nm: '대치동', sgg_nm: '강남구', sgg_cd: '11680', jibun: '316', road_nm: '삼성로',     cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 14 },
  { id: 8,  apt_nm: '타워팰리스',       deal_date: '2025-01-11', deal_amount: 420000, deal_amount_billion: 42.0, area_pyeong: 58, price_per_pyeong: 7.24, exclu_use_ar: 198.5,  floor: 42, build_year: 2002, umd_nm: '도곡동', sgg_nm: '강남구', sgg_cd: '11680', jibun: '467', road_nm: '언주로',     cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 11 },
  { id: 9,  apt_nm: '은마아파트',       deal_date: '2025-01-09', deal_amount: 220000, deal_amount_billion: 22.0, area_pyeong: 34, price_per_pyeong: 6.47, exclu_use_ar: 115.0,  floor: 9,  build_year: 1979, umd_nm: '대치동', sgg_nm: '강남구', sgg_cd: '11680', jibun: '316', road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 9  },
  { id: 10, apt_nm: '개포주공1단지',    deal_date: '2025-01-06', deal_amount: 280000, deal_amount_billion: 28.0, area_pyeong: 27, price_per_pyeong: 10.37,exclu_use_ar: 90.0,   floor: 4,  build_year: 1982, umd_nm: '개포동', sgg_nm: '강남구', sgg_cd: '11680', jibun: '12',  road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 6  },

  // 마포구
  { id: 11, apt_nm: '마포래미안푸르지오',deal_date: '2025-01-13', deal_amount: 128000, deal_amount_billion: 12.8, area_pyeong: 33, price_per_pyeong: 3.88, exclu_use_ar: 114.9,  floor: 11, build_year: 2014, umd_nm: '아현동', sgg_nm: '마포구', sgg_cd: '11440', jibun: '산15',road_nm: '마포대로',   cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 13 },
  { id: 12, apt_nm: '공덕SK리더스뷰',   deal_date: '2025-01-07', deal_amount: 105000, deal_amount_billion: 10.5, area_pyeong: 25, price_per_pyeong: 4.20, exclu_use_ar: 84.8,   floor: 7,  build_year: 2012, umd_nm: '공덕동', sgg_nm: '마포구', sgg_cd: '11440', jibun: '370', road_nm: '백범로',     cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 7  },
  { id: 13, apt_nm: '상암월드컵파크',   deal_date: '2025-01-03', deal_amount:  78000, deal_amount_billion:  7.8, area_pyeong: 24, price_per_pyeong: 3.25, exclu_use_ar: 84.0,   floor: 6,  build_year: 2004, umd_nm: '상암동', sgg_nm: '마포구', sgg_cd: '11440', jibun: '1600',road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 3  },

  // 노원구
  { id: 14, apt_nm: '상계주공7단지',    deal_date: '2025-01-10', deal_amount:  62000, deal_amount_billion:  6.2, area_pyeong: 23, price_per_pyeong: 2.70, exclu_use_ar: 79.8,   floor: 5,  build_year: 1988, umd_nm: '상계동', sgg_nm: '노원구', sgg_cd: '11350', jibun: '725', road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 10 },
  { id: 15, apt_nm: '중계그린아파트',   deal_date: '2025-01-05', deal_amount:  55000, deal_amount_billion:  5.5, area_pyeong: 19, price_per_pyeong: 2.89, exclu_use_ar: 66.0,   floor: 3,  build_year: 1991, umd_nm: '중계동', sgg_nm: '노원구', sgg_cd: '11350', jibun: '310', road_nm: null,         cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 5  },

  // 서초구
  { id: 16, apt_nm: '반포자이',         deal_date: '2025-01-16', deal_amount: 350000, deal_amount_billion: 35.0, area_pyeong: 40, price_per_pyeong: 8.75, exclu_use_ar: 135.0,  floor: 14, build_year: 2009, umd_nm: '반포동', sgg_nm: '서초구', sgg_cd: '11650', jibun: '19',  road_nm: '반포대로',   cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 16 },
  { id: 17, apt_nm: '아크로리버파크',   deal_date: '2025-01-08', deal_amount: 450000, deal_amount_billion: 45.0, area_pyeong: 50, price_per_pyeong: 9.00, exclu_use_ar: 172.4,  floor: 25, build_year: 2016, umd_nm: '반포동', sgg_nm: '서초구', sgg_cd: '11650', jibun: '11',  road_nm: '신반포로',   cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 8  },
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
    { yearMonth: '2024-01', avgPrice: 135000, avgPricePerPyeong: 5.40, count: 4 },
    { yearMonth: '2024-03', avgPrice: 138000, avgPricePerPyeong: 5.52, count: 3 },
    { yearMonth: '2024-05', avgPrice: 140000, avgPricePerPyeong: 5.60, count: 5 },
    { yearMonth: '2024-07', avgPrice: 142000, avgPricePerPyeong: 5.68, count: 4 },
    { yearMonth: '2024-09', avgPrice: 143000, avgPricePerPyeong: 5.72, count: 3 },
    { yearMonth: '2024-11', avgPrice: 144000, avgPricePerPyeong: 5.76, count: 4 },
    { yearMonth: '2025-01', avgPrice: 146500, avgPricePerPyeong: 5.86, count: 3 },
  ],
  byArea: [
    { label: '17평대', minPyeong: 15, maxPyeong: 20, count:  8, avgPrice: 100000 },
    { label: '25평대', minPyeong: 20, maxPyeong: 30, count: 28, avgPrice: 146500 },
    { label: '34평대', minPyeong: 30, maxPyeong: 40, count: 11, avgPrice: 192000 },
  ],
  recentTransactions: [
    { id: 1, apt_nm: '포레나송파', deal_date: '2025-01-15', deal_amount: 145000, deal_amount_billion: 14.5, area_pyeong: 25, price_per_pyeong: 5.80, exclu_use_ar: 84.95, floor: 8,  build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 15 },
    { id: 6, apt_nm: '포레나송파', deal_date: '2025-01-04', deal_amount: 148000, deal_amount_billion: 14.8, area_pyeong: 25, price_per_pyeong: 5.92, exclu_use_ar: 84.95, floor: 12, build_year: 2021, umd_nm: '위례동', sgg_nm: '송파구', sgg_cd: '11710', jibun: '100', road_nm: '위례성대로', cdeal_type: null, deal_year: 2025, deal_month: 1, deal_day: 4  },
  ],
};
