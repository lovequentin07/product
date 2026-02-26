// src/types/management-fee.ts
// 관리비 지킴이 서비스 타입 정의

export interface MgmtFeeRow {
  id: number;
  apt_meta_id?: number;
  kapt_code: string;
  apt_nm: string;
  sido: string;
  sgg_nm: string;
  umd_nm: string | null;
  billing_ym: string;  // YYYYMM

  // 공용관리비
  common_mgmt_total: number;
  labor_cost: number;
  office_cost: number;
  tax_fee: number;
  clothing_cost: number;
  training_cost: number;
  vehicle_cost: number;
  other_overhead: number;
  cleaning_cost: number;
  security_cost: number;
  disinfection_cost: number;
  elevator_cost: number;
  network_cost: number;
  repair_cost: number;
  facility_cost: number;
  safety_cost: number;
  disaster_cost: number;
  trust_mgmt_fee: number;

  // 개별사용료
  indiv_usage_total: number;
  heating_common: number;
  heating_indiv: number;
  hot_water_common: number;
  hot_water_indiv: number;
  gas_common: number;
  gas_indiv: number;
  electricity_common: number;
  electricity_indiv: number;
  water_common: number;
  water_indiv: number;
  tv_fee: number;
  sewage_fee: number;
  waste_fee: number;
  tenant_rep_cost: number;
  insurance_cost: number;
  election_cost: number;
  other_indiv: number;

  // 장기수선충당금
  ltm_monthly_charge: number;
  ltm_monthly_use: number;
  ltm_total_reserve: number;
  ltm_reserve_rate: number;
  misc_income: number;

  // 세대 정보
  household_cnt: number | null;

  // 세대당 평균
  common_per_hh: number | null;
  security_per_hh: number | null;
  cleaning_per_hh: number | null;
  heating_per_hh: number | null;
  electricity_per_hh: number | null;
  water_per_hh: number | null;
  ltm_per_hh: number | null;
  total_per_hh: number | null;
}

/** 아파트 목록 (검색 드롭다운용) */
export interface MgmtFeeApt {
  kapt_code: string;
  apt_nm: string;
  umd_nm: string | null;
  billing_ym: string;  // 가장 최신 발생년월
}

/** 분석 결과 (랭킹 포함) */
export interface MgmtFeeResult extends MgmtFeeRow {
  // 동 단위 랭킹
  umd_rank: number | null;
  umd_total: number | null;
  umd_avg_common: number | null;

  // 구 단위 랭킹
  sgg_rank: number | null;
  sgg_total: number | null;
  sgg_avg_common: number | null;
  sgg_avg_security: number | null;

  // 서울 전체 랭킹
  seoul_rank: number | null;
  seoul_total: number | null;
  seoul_avg_common: number | null;
  seoul_avg_security: number | null;

  // 비중 비율 순위 (서울 전체)
  common_ratio_rank: number | null;   // 공용관리비 비중 순위
  personal_ratio_rank: number | null; // 개인관리비 비중 순위
}

/** 월별 이력 (차트용) */
export interface MgmtFeeHistory {
  billing_ym: string;
  common_per_hh: number | null;
  total_per_hh: number | null;
  household_cnt: number | null;
}
