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
  umd_avg_total: number | null;

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

  // 서울 평균 금액
  seoul_avg_total: number | null;
  sgg_avg_total: number | null;

  // 세부항목 동/구 평균
  umd_avg_security: number | null;
  sgg_avg_cleaning: number | null;
  umd_avg_cleaning: number | null;
  sgg_avg_heating: number | null;
  umd_avg_heating: number | null;
  sgg_avg_electricity: number | null;
  umd_avg_electricity: number | null;
  sgg_avg_water: number | null;
  umd_avg_water: number | null;
  sgg_avg_ltm: number | null;
  umd_avg_ltm: number | null;
  sgg_avg_labor: number | null;
  umd_avg_labor: number | null;
  sgg_avg_elevator: number | null;
  umd_avg_elevator: number | null;
  sgg_avg_repair: number | null;
  umd_avg_repair: number | null;
  sgg_avg_trust_mgmt: number | null;
  umd_avg_trust_mgmt: number | null;
  sgg_avg_hot_water: number | null;
  umd_avg_hot_water: number | null;
  sgg_avg_gas: number | null;
  umd_avg_gas: number | null;

  // 공용관리비 순위
  common_seoul_rank: number | null;
  common_sgg_rank: number | null;

  // 개인관리비 순위 (total - common)
  personal_seoul_rank: number | null;
  personal_sgg_rank: number | null;

  // 세부항목 동/구 평균 (18개 신규)
  sgg_avg_office: number | null;
  umd_avg_office: number | null;
  sgg_avg_tax: number | null;
  umd_avg_tax: number | null;
  sgg_avg_clothing: number | null;
  umd_avg_clothing: number | null;
  sgg_avg_training: number | null;
  umd_avg_training: number | null;
  sgg_avg_vehicle: number | null;
  umd_avg_vehicle: number | null;
  sgg_avg_other_overhead: number | null;
  umd_avg_other_overhead: number | null;
  sgg_avg_disinfection: number | null;
  umd_avg_disinfection: number | null;
  sgg_avg_network: number | null;
  umd_avg_network: number | null;
  sgg_avg_facility: number | null;
  umd_avg_facility: number | null;
  sgg_avg_safety: number | null;
  umd_avg_safety: number | null;
  sgg_avg_disaster: number | null;
  umd_avg_disaster: number | null;
  sgg_avg_tv: number | null;
  umd_avg_tv: number | null;
  sgg_avg_sewage: number | null;
  umd_avg_sewage: number | null;
  sgg_avg_waste: number | null;
  umd_avg_waste: number | null;
  sgg_avg_tenant_rep: number | null;
  umd_avg_tenant_rep: number | null;
  sgg_avg_insurance: number | null;
  umd_avg_insurance: number | null;
  sgg_avg_election: number | null;
  umd_avg_election: number | null;
  sgg_avg_other_indiv: number | null;
  umd_avg_other_indiv: number | null;
}

/** 관리비 절약 1위 추천 (동/서울) */
export interface MgmtFeeTopApt {
  apt_nm: string;
  sgg_nm: string;
  umd_nm: string | null;
  kapt_code: string;
  total_per_hh: number;
}

/** 월별 이력 (차트용) */
export interface MgmtFeeHistory {
  billing_ym: string;
  common_per_hh: number | null;
  total_per_hh: number | null;
  household_cnt: number | null;
}
