// src/lib/db/management-fee.ts
// 관리비 지킴이 D1 쿼리 함수

import { MgmtFeeApt, MgmtFeeResult, MgmtFeeRow, MgmtFeeHistory, MgmtFeeTopApt } from '@apt-mgmt/types/management-fee';

// -------------------------
// Mock 데이터 (로컬 개발용)
// -------------------------
const MOCK_APTS: MgmtFeeApt[] = [
  { kapt_code: 'A10001000', apt_nm: '래미안대치팰리스', sgg_nm: '강남구', umd_nm: '대치동', billing_ym: '202501' },
  { kapt_code: 'A10001001', apt_nm: '은마아파트', sgg_nm: '강남구', umd_nm: '대치동', billing_ym: '202501' },
  { kapt_code: 'A10001002', apt_nm: '타워팰리스', sgg_nm: '강남구', umd_nm: '도곡동', billing_ym: '202501' },
  { kapt_code: 'A10001003', apt_nm: '개포주공', sgg_nm: '강남구', umd_nm: '개포동', billing_ym: '202501' },
  { kapt_code: 'A10001004', apt_nm: '삼성현대', sgg_nm: '강남구', umd_nm: '삼성동', billing_ym: '202501' },
];

// mock 데이터 세부 비용을 common_per_hh / personal_per_hh 비례 계산
function mockCosts(commonPerHh: number, personalPerHh: number, hh: number) {
  const c = commonPerHh * hh;
  const p = personalPerHh * hh;
  return {
    // 공용 세부 (비율 합 = 1.0)
    common_mgmt_total: c,
    labor_cost:        Math.round(c * 0.400),
    office_cost:       Math.round(c * 0.040),
    tax_fee:           Math.round(c * 0.020),
    clothing_cost:     Math.round(c * 0.010),
    training_cost:     Math.round(c * 0.004),
    vehicle_cost:      Math.round(c * 0.006),
    other_overhead:    Math.round(c * 0.020),
    cleaning_cost:     Math.round(c * 0.100),
    security_cost:     Math.round(c * 0.200),
    disinfection_cost: Math.round(c * 0.006),
    elevator_cost:     Math.round(c * 0.060),
    network_cost:      Math.round(c * 0.010),
    repair_cost:       Math.round(c * 0.060),
    facility_cost:     Math.round(c * 0.030),
    safety_cost:       Math.round(c * 0.010),
    disaster_cost:     Math.round(c * 0.004),
    trust_mgmt_fee:    Math.round(c * 0.020),
    cleaning_per_hh:   Math.round(c * 0.100 / hh),
    security_per_hh:   Math.round(c * 0.200 / hh),
    // 개인 세부 (비율 합 = 1.0)
    indiv_usage_total:  p,
    heating_common:     Math.round(p * 0.06250),
    heating_indiv:      Math.round(p * 0.25000),
    heating_per_hh:     Math.round(p * 0.31250 / hh),
    hot_water_common:   Math.round(p * 0.01250),
    hot_water_indiv:    Math.round(p * 0.06250),
    gas_common:         0,
    gas_indiv:          Math.round(p * 0.03750),
    electricity_common: Math.round(p * 0.10000),
    electricity_indiv:  Math.round(p * 0.18750),
    electricity_per_hh: Math.round(p * 0.28750 / hh),
    water_common:       Math.round(p * 0.02500),
    water_indiv:        Math.round(p * 0.10000),
    water_per_hh:       Math.round(p * 0.12500 / hh),
    tv_fee:             Math.round(p * 0.01250),
    sewage_fee:         Math.round(p * 0.00625),
    waste_fee:          Math.round(p * 0.01000),
    tenant_rep_cost:    Math.round(p * 0.00375),
    insurance_cost:     Math.round(p * 0.02500),
    election_cost:      Math.round(p * 0.00125),
    other_indiv:        Math.round(p * 0.10375),
  };
}

// 공통 필드 (관리비 항목 등)
const MOCK_BASE = {
  sido: '서울특별시',
  sgg_nm: '강남구',
  billing_ym: '202501',
  common_mgmt_total: 50000000,
  labor_cost: 20000000,
  office_cost: 2000000,
  tax_fee: 1000000,
  clothing_cost: 500000,
  training_cost: 200000,
  vehicle_cost: 300000,
  other_overhead: 1000000,
  cleaning_cost: 5000000,
  security_cost: 10000000,
  disinfection_cost: 300000,
  elevator_cost: 3000000,
  network_cost: 500000,
  repair_cost: 3000000,
  facility_cost: 1500000,
  safety_cost: 500000,
  disaster_cost: 200000,
  trust_mgmt_fee: 1000000,
  indiv_usage_total: 80000000,
  heating_common: 5000000,
  heating_indiv: 20000000,
  hot_water_common: 1000000,
  hot_water_indiv: 5000000,
  gas_common: 0,
  gas_indiv: 3000000,
  electricity_common: 8000000,
  electricity_indiv: 15000000,
  water_common: 2000000,
  water_indiv: 8000000,
  tv_fee: 1000000,
  sewage_fee: 500000,
  waste_fee: 800000,
  tenant_rep_cost: 300000,
  insurance_cost: 2000000,
  election_cost: 100000,
  other_indiv: 8300000,
  ltm_monthly_charge: 10000000,
  ltm_monthly_use: 2000000,
  ltm_total_reserve: 300000000,
  ltm_reserve_rate: 85.5,
  misc_income: 2000000,
  household_cnt: 500,
  security_per_hh: Math.round(10000000 / 500),   // security_cost / household_cnt
  cleaning_per_hh: Math.round(5000000 / 500),    // cleaning_cost / household_cnt
  ltm_per_hh: Math.round(10000000 / 500),        // ltm_monthly_charge / household_cnt
  sgg_avg_security: 4500,
  seoul_avg_security: 3800,
  umd_avg_common: 22000,
  umd_avg_total: 60000,
  umd_avg_security: 18000,
  sgg_avg_cleaning: 8000,
  umd_avg_cleaning: 8000,
  sgg_avg_heating: 9000,
  umd_avg_heating: 9000,
  sgg_avg_electricity: 7500,
  umd_avg_electricity: 7500,
  sgg_avg_water: 4000,
  umd_avg_water: 4000,
  sgg_avg_ltm: 18000,
  umd_avg_ltm: 18000,
  sgg_avg_labor: 35000,
  umd_avg_labor: 38000,
  sgg_avg_elevator: 5000,
  umd_avg_elevator: 5500,
  sgg_avg_repair: 5000,
  umd_avg_repair: 5500,
  sgg_avg_trust_mgmt: 1500,
  umd_avg_trust_mgmt: 1800,
  sgg_avg_hot_water: 9500,
  umd_avg_hot_water: 10000,
  sgg_avg_gas: 4500,
  umd_avg_gas: 5500,
  // 신규 18개 항목 (mock 평균값)
  sgg_avg_office: 3500,   umd_avg_office: 3800,
  sgg_avg_tax: 1800,      umd_avg_tax: 1900,
  sgg_avg_clothing: 900,  umd_avg_clothing: 950,
  sgg_avg_training: 350,  umd_avg_training: 370,
  sgg_avg_vehicle: 520,   umd_avg_vehicle: 550,
  sgg_avg_other_overhead: 1700, umd_avg_other_overhead: 1800,
  sgg_avg_disinfection: 520,    umd_avg_disinfection: 550,
  sgg_avg_network: 900,         umd_avg_network: 950,
  sgg_avg_facility: 2600,       umd_avg_facility: 2800,
  sgg_avg_safety: 870,          umd_avg_safety: 920,
  sgg_avg_disaster: 350,        umd_avg_disaster: 370,
  sgg_avg_tv: 1700,             umd_avg_tv: 1800,
  sgg_avg_sewage: 850,          umd_avg_sewage: 900,
  sgg_avg_waste: 1400,          umd_avg_waste: 1500,
  sgg_avg_tenant_rep: 520,      umd_avg_tenant_rep: 550,
  sgg_avg_insurance: 3500,      umd_avg_insurance: 3700,
  sgg_avg_election: 170,        umd_avg_election: 180,
  sgg_avg_other_indiv: 7000,    umd_avg_other_indiv: 7500,
};

// 5개 tier mock: sgg_rank/sgg_total 기준
// A: ≤20%, B: 21-40%, C: 41-60%, D: 61-80%, E: >80%
const MOCK_RESULTS: Record<string, MgmtFeeResult> = {
  // A등급: sgg 16%, seoul 10%, umd 25%
  A10001000: {
    ...MOCK_BASE,
    ...mockCosts(14000, 31000, 500),
    id: 1, kapt_code: 'A10001000', apt_nm: '래미안대치팰리스', umd_nm: '대치동',
    common_per_hh: 14000, total_per_hh: 45000,
    umd_rank: 3, umd_total: 12,
    sgg_rank: 45, sgg_total: 280, sgg_avg_common: 20000,
    seoul_rank: 320, seoul_total: 3200, seoul_avg_common: 18000,
    seoul_avg_total: 70000, sgg_avg_total: 65000,
    common_seoul_rank: 280, common_sgg_rank: 38,
    personal_seoul_rank: 350, personal_sgg_rank: 45,
    avg_pyeong: 33, avg_price: 52, build_year: 2002,
    peer_seoul_cnt: 10, peer_seoul_avg: 420000, peer_seoul_min: 280000, peer_seoul_max: 680000,
    peer_sgg_cnt:    4, peer_sgg_avg:  480000,  peer_sgg_min:  320000,  peer_sgg_max:  620000,
    peer_umd_cnt: null, peer_umd_avg: null, peer_umd_min: null, peer_umd_max: null,
  },
  // B등급: sgg 32%, seoul 25%, umd 42%
  A10001001: {
    ...MOCK_BASE,
    ...mockCosts(18500, 39500, 500),
    id: 2, kapt_code: 'A10001001', apt_nm: '은마아파트', umd_nm: '대치동',
    common_per_hh: 18500, total_per_hh: 58000,
    umd_rank: 5, umd_total: 12,
    sgg_rank: 90, sgg_total: 280, sgg_avg_common: 20000,
    seoul_rank: 800, seoul_total: 3200, seoul_avg_common: 18000,
    seoul_avg_total: 70000, sgg_avg_total: 65000,
    common_seoul_rank: 750, common_sgg_rank: 88,
    personal_seoul_rank: 850, personal_sgg_rank: 98,
    avg_pyeong: null, avg_price: null, build_year: null,
    peer_seoul_cnt: null, peer_seoul_avg: null, peer_seoul_min: null, peer_seoul_max: null,
    peer_sgg_cnt: null, peer_sgg_avg: null, peer_sgg_min: null, peer_sgg_max: null,
    peer_umd_cnt: null, peer_umd_avg: null, peer_umd_min: null, peer_umd_max: null,
  },
  // C등급: sgg 50%, seoul 50%, umd 50%
  A10001002: {
    ...MOCK_BASE,
    ...mockCosts(20500, 47500, 500),
    id: 3, kapt_code: 'A10001002', apt_nm: '타워팰리스', umd_nm: '도곡동',
    common_per_hh: 20500, total_per_hh: 68000,
    umd_rank: 6, umd_total: 12,
    sgg_rank: 140, sgg_total: 280, sgg_avg_common: 20000,
    seoul_rank: 1600, seoul_total: 3200, seoul_avg_common: 18000,
    seoul_avg_total: 70000, sgg_avg_total: 65000,
    common_seoul_rank: 1600, common_sgg_rank: 140,
    personal_seoul_rank: 1600, personal_sgg_rank: 140,
    avg_pyeong: null, avg_price: null, build_year: null,
    peer_seoul_cnt: null, peer_seoul_avg: null, peer_seoul_min: null, peer_seoul_max: null,
    peer_sgg_cnt: null, peer_sgg_avg: null, peer_sgg_min: null, peer_sgg_max: null,
    peer_umd_cnt: null, peer_umd_avg: null, peer_umd_min: null, peer_umd_max: null,
  },
  // D등급: sgg 71%, seoul 68%, umd 67%
  A10001003: {
    ...MOCK_BASE,
    ...mockCosts(25000, 57000, 500),
    id: 4, kapt_code: 'A10001003', apt_nm: '개포주공', umd_nm: '개포동',
    common_per_hh: 25000, total_per_hh: 82000,
    umd_rank: 8, umd_total: 12,
    sgg_rank: 200, sgg_total: 280, sgg_avg_common: 20000,
    seoul_rank: 2170, seoul_total: 3200, seoul_avg_common: 18000,
    seoul_avg_total: 70000, sgg_avg_total: 65000,
    common_seoul_rank: 2200, common_sgg_rank: 198,
    personal_seoul_rank: 2100, personal_sgg_rank: 192,
    avg_pyeong: null, avg_price: null, build_year: null,
    peer_seoul_cnt: null, peer_seoul_avg: null, peer_seoul_min: null, peer_seoul_max: null,
    peer_sgg_cnt: null, peer_sgg_avg: null, peer_sgg_min: null, peer_sgg_max: null,
    peer_umd_cnt: null, peer_umd_avg: null, peer_umd_min: null, peer_umd_max: null,
  },
  // E등급: sgg 93%, seoul 91%, umd 92%
  A10001004: {
    ...MOCK_BASE,
    ...mockCosts(33000, 72000, 500),
    id: 5, kapt_code: 'A10001004', apt_nm: '삼성현대', umd_nm: '삼성동',
    common_per_hh: 33000, total_per_hh: 105000,
    umd_rank: 11, umd_total: 12,
    sgg_rank: 260, sgg_total: 280, sgg_avg_common: 20000,
    seoul_rank: 2920, seoul_total: 3200, seoul_avg_common: 18000,
    seoul_avg_total: 70000, sgg_avg_total: 65000,
    common_seoul_rank: 2900, common_sgg_rank: 258,
    personal_seoul_rank: 2950, personal_sgg_rank: 262,
    avg_pyeong: null, avg_price: null, build_year: null,
    peer_seoul_cnt: null, peer_seoul_avg: null, peer_seoul_min: null, peer_seoul_max: null,
    peer_sgg_cnt: null, peer_sgg_avg: null, peer_sgg_min: null, peer_sgg_max: null,
    peer_umd_cnt: null, peer_umd_avg: null, peer_umd_min: null, peer_umd_max: null,
  },
};

// -------------------------
// D1 쿼리
// -------------------------

async function getD1MgmtFeeApts(db: D1Database, sgg_nm: string): Promise<MgmtFeeApt[]> {
  const result = await db
    .prepare(
      `SELECT kapt_code, apt_nm, sgg_nm, umd_nm, MAX(billing_ym) as billing_ym
       FROM apt_mgmt_fee
       WHERE sgg_nm = ? AND sido = '서울특별시'
       GROUP BY kapt_code
       ORDER BY apt_nm`
    )
    .bind(sgg_nm)
    .all<MgmtFeeApt>();
  return result.results ?? [];
}

async function getD1MgmtFeeSearch(db: D1Database, q: string): Promise<MgmtFeeApt[]> {
  const result = await db
    .prepare(
      `SELECT kapt_code, apt_nm, sgg_nm, umd_nm, MAX(billing_ym) as billing_ym
       FROM apt_mgmt_fee
       WHERE apt_nm LIKE ? AND sido = '서울특별시'
       GROUP BY kapt_code
       ORDER BY apt_nm
       LIMIT 50`
    )
    .bind(`%${q}%`)
    .all<MgmtFeeApt>();
  return result.results ?? [];
}

async function getD1MgmtFeeResult(
  db: D1Database,
  kapt_code: string,
  cache?: KVNamespace | null
): Promise<MgmtFeeResult | null> {
  // 최신 billing_ym 조회
  const latestRow = await db
    .prepare(`SELECT MAX(billing_ym) as max_ym FROM apt_mgmt_fee WHERE kapt_code = ?`)
    .bind(kapt_code)
    .first<{ max_ym: string }>();

  if (!latestRow?.max_ym) return null;

  const billing_ym = latestRow.max_ym;
  const cacheKey = `v12:fee:${kapt_code}:${billing_ym}`;

  if (cache) {
    try {
      const cached = await cache.get(cacheKey, 'json') as MgmtFeeResult | null;
      if (cached) return cached;
    } catch (e) {
      console.error('[apt-mgmt] cache.get failed:', kapt_code, e);
    }
  }

  // Step 1: 메인 행 (SELECT * — D1 100컬럼 한계로 JOIN 제거)
  const baseRow = await db
    .prepare(`SELECT * FROM apt_mgmt_fee WHERE kapt_code = ? AND billing_ym = ?`)
    .bind(kapt_code, billing_ym)
    .first<MgmtFeeRow>();

  if (!baseRow) return null;

  const sgg = baseRow.sgg_nm;
  const umd = baseRow.umd_nm;

  // 랭킹/평균 계산 필드 null로 초기화 후 아래에서 채움
  const row: MgmtFeeResult = {
    ...baseRow,
    umd_rank: null, umd_total: null, umd_avg_common: null, umd_avg_total: null, umd_avg_security: null,
    sgg_rank: null, sgg_total: null, sgg_avg_common: null, sgg_avg_security: null, sgg_avg_total: null,
    seoul_rank: null, seoul_total: null, seoul_avg_common: null, seoul_avg_security: null, seoul_avg_total: null,
    common_seoul_rank: null, common_sgg_rank: null,
    personal_seoul_rank: null, personal_sgg_rank: null,
    sgg_avg_cleaning: null, umd_avg_cleaning: null,
    sgg_avg_heating: null, umd_avg_heating: null,
    sgg_avg_electricity: null, umd_avg_electricity: null,
    sgg_avg_water: null, umd_avg_water: null,
    sgg_avg_ltm: null, umd_avg_ltm: null,
    sgg_avg_labor: null, umd_avg_labor: null,
    sgg_avg_elevator: null, umd_avg_elevator: null,
    sgg_avg_repair: null, umd_avg_repair: null,
    sgg_avg_trust_mgmt: null, umd_avg_trust_mgmt: null,
    sgg_avg_hot_water: null, umd_avg_hot_water: null,
    sgg_avg_gas: null, umd_avg_gas: null,
    sgg_avg_office: null, umd_avg_office: null,
    sgg_avg_tax: null, umd_avg_tax: null,
    sgg_avg_clothing: null, umd_avg_clothing: null,
    sgg_avg_training: null, umd_avg_training: null,
    sgg_avg_vehicle: null, umd_avg_vehicle: null,
    sgg_avg_other_overhead: null, umd_avg_other_overhead: null,
    sgg_avg_disinfection: null, umd_avg_disinfection: null,
    sgg_avg_network: null, umd_avg_network: null,
    sgg_avg_facility: null, umd_avg_facility: null,
    sgg_avg_safety: null, umd_avg_safety: null,
    sgg_avg_disaster: null, umd_avg_disaster: null,
    sgg_avg_tv: null, umd_avg_tv: null,
    sgg_avg_sewage: null, umd_avg_sewage: null,
    sgg_avg_waste: null, umd_avg_waste: null,
    sgg_avg_tenant_rep: null, umd_avg_tenant_rep: null,
    sgg_avg_insurance: null, umd_avg_insurance: null,
    sgg_avg_election: null, umd_avg_election: null,
    sgg_avg_other_indiv: null, umd_avg_other_indiv: null,
    avg_pyeong: null, avg_price: null, build_year: null,
    peer_seoul_cnt: null, peer_seoul_avg: null, peer_seoul_min: null, peer_seoul_max: null,
    peer_sgg_cnt:   null, peer_sgg_avg:   null, peer_sgg_min:   null, peer_sgg_max:   null,
    peer_umd_cnt:   null, peer_umd_avg:   null, peer_umd_min:   null, peer_umd_max:   null,
  };

  // Step 2: 사전집계 평균 (최대 3행 × 36컬럼 — D1 한계 안전)
  // summary가 billing_ym보다 한 달 늦게 업데이트될 수 있으므로 가장 최근 가용 월 사용
  try {
    const summaryYmRow = await db
      .prepare(`SELECT MAX(billing_ym) as max_ym FROM apt_mgmt_fee_summary WHERE billing_ym <= ?`)
      .bind(billing_ym)
      .first<{ max_ym: string | null }>();
    const summary_ym = summaryYmRow?.max_ym ?? billing_ym;

    const sumRows = await db
      .prepare(`
        SELECT * FROM apt_mgmt_fee_summary
        WHERE billing_ym = ?
          AND ((sgg_nm = '' AND umd_nm = '')
            OR (sgg_nm = ? AND umd_nm = '')
            OR (sgg_nm = ? AND umd_nm = COALESCE(?, '')))
      `)
      .bind(summary_ym, sgg, sgg, umd)
      .all<Record<string, unknown>>();

    const seoulSum = sumRows.results.find(r => r.sgg_nm === '' && r.umd_nm === '');
    const sggSum   = sumRows.results.find(r => r.sgg_nm === sgg && r.umd_nm === '');
    const umdSum   = sumRows.results.find(r => r.sgg_nm === sgg && r.umd_nm === (umd ?? ''));

    if (seoulSum) {
      row.seoul_avg_common   = (seoulSum.avg_common_per_hh   as number | null) ?? null;
      row.seoul_avg_security = (seoulSum.avg_security_per_hh as number | null) ?? null;
      row.seoul_avg_total    = (seoulSum.avg_total_per_hh    as number | null) ?? null;
    }

    const SUMMARY_MAP: [string, string][] = [
      ['avg_common_per_hh',        'avg_common'],
      ['avg_security_per_hh',      'avg_security'],
      ['avg_total_per_hh',         'avg_total'],
      ['avg_cleaning_per_hh',      'avg_cleaning'],
      ['avg_heating_per_hh',       'avg_heating'],
      ['avg_electricity_per_hh',   'avg_electricity'],
      ['avg_water_per_hh',         'avg_water'],
      ['avg_ltm_per_hh',           'avg_ltm'],
      ['avg_labor_per_hh',         'avg_labor'],
      ['avg_elevator_per_hh',      'avg_elevator'],
      ['avg_repair_per_hh',        'avg_repair'],
      ['avg_trust_mgmt_per_hh',    'avg_trust_mgmt'],
      ['avg_hot_water_per_hh',     'avg_hot_water'],
      ['avg_gas_per_hh',           'avg_gas'],
      ['avg_office_per_hh',        'avg_office'],
      ['avg_tax_per_hh',           'avg_tax'],
      ['avg_clothing_per_hh',      'avg_clothing'],
      ['avg_training_per_hh',      'avg_training'],
      ['avg_vehicle_per_hh',       'avg_vehicle'],
      ['avg_other_overhead_per_hh','avg_other_overhead'],
      ['avg_disinfection_per_hh',  'avg_disinfection'],
      ['avg_network_per_hh',       'avg_network'],
      ['avg_facility_per_hh',      'avg_facility'],
      ['avg_safety_per_hh',        'avg_safety'],
      ['avg_disaster_per_hh',      'avg_disaster'],
      ['avg_tv_per_hh',            'avg_tv'],
      ['avg_sewage_per_hh',        'avg_sewage'],
      ['avg_waste_per_hh',         'avg_waste'],
      ['avg_tenant_rep_per_hh',    'avg_tenant_rep'],
      ['avg_insurance_per_hh',     'avg_insurance'],
      ['avg_election_per_hh',      'avg_election'],
      ['avg_other_indiv_per_hh',   'avg_other_indiv'],
    ];

    const rowDyn = row as unknown as Record<string, number | null>;
    if (sggSum) {
      for (const [src, sfx] of SUMMARY_MAP) rowDyn[`sgg_${sfx}`] = (sggSum[src] as number | null) ?? null;
    }
    if (umdSum) {
      for (const [src, sfx] of SUMMARY_MAP) rowDyn[`umd_${sfx}`] = (umdSum[src] as number | null) ?? null;
    }
  } catch (e) {
    console.error('[apt-mgmt] summary query failed:', kapt_code, e);
  }

  // Step 2b: 단지 프로필 + 피어 그룹 통계
  try {
    const metaRow = await db
      .prepare(`SELECT avg_pyeong, avg_price, build_year FROM apt_meta WHERE kapt_code = ?`)
      .bind(kapt_code)
      .first<{ avg_pyeong: number | null; avg_price: number | null; build_year: number | null }>();

    row.avg_pyeong = metaRow?.avg_pyeong ?? null;
    row.avg_price  = metaRow?.avg_price  ?? null;
    row.build_year = metaRow?.build_year ?? null;

    const p  = row.avg_pyeong;
    const pr = row.avg_price;

    if (p !== null && pr !== null) {
      const PYEONG_RANGE = 5;
      const PRICE_RANGE  = 5;

      const [peerSeoul, peerSgg, peerUmd] = await db.batch([
        db.prepare(`
          SELECT COUNT(DISTINCT f.kapt_code) as cnt,
                 AVG(f.total_per_hh) as avg_val,
                 MIN(f.total_per_hh) as min_val,
                 MAX(f.total_per_hh) as max_val
          FROM apt_mgmt_fee f
          JOIN apt_meta m ON m.kapt_code = f.kapt_code
          WHERE f.billing_ym = ?
            AND f.total_per_hh > 0
            AND m.avg_pyeong BETWEEN ? AND ?
            AND m.avg_price  BETWEEN ? AND ?
        `).bind(billing_ym, p - PYEONG_RANGE, p + PYEONG_RANGE, pr - PRICE_RANGE, pr + PRICE_RANGE),

        db.prepare(`
          SELECT COUNT(DISTINCT f.kapt_code) as cnt,
                 AVG(f.total_per_hh) as avg_val,
                 MIN(f.total_per_hh) as min_val,
                 MAX(f.total_per_hh) as max_val
          FROM apt_mgmt_fee f
          JOIN apt_meta m ON m.kapt_code = f.kapt_code
          WHERE f.billing_ym = ?
            AND f.total_per_hh > 0
            AND m.avg_pyeong BETWEEN ? AND ?
            AND m.avg_price  BETWEEN ? AND ?
            AND m.sgg_nm = ?
        `).bind(billing_ym, p - PYEONG_RANGE, p + PYEONG_RANGE, pr - PRICE_RANGE, pr + PRICE_RANGE, sgg),

        db.prepare(`
          SELECT COUNT(DISTINCT f.kapt_code) as cnt,
                 AVG(f.total_per_hh) as avg_val,
                 MIN(f.total_per_hh) as min_val,
                 MAX(f.total_per_hh) as max_val
          FROM apt_mgmt_fee f
          JOIN apt_meta m ON m.kapt_code = f.kapt_code
          WHERE f.billing_ym = ?
            AND f.total_per_hh > 0
            AND m.avg_pyeong BETWEEN ? AND ?
            AND m.avg_price  BETWEEN ? AND ?
            AND m.sgg_nm = ?
            AND m.umd_nm = ?
        `).bind(billing_ym, p - PYEONG_RANGE, p + PYEONG_RANGE, pr - PRICE_RANGE, pr + PRICE_RANGE, sgg, umd ?? ''),
      ]);

      const s = peerSeoul.results[0] as { cnt: number; avg_val: number; min_val: number; max_val: number } | undefined;
      const g = peerSgg.results[0]   as { cnt: number; avg_val: number; min_val: number; max_val: number } | undefined;
      const u = peerUmd.results[0]   as { cnt: number; avg_val: number; min_val: number; max_val: number } | undefined;

      row.peer_seoul_cnt = s?.cnt     ?? null;
      row.peer_seoul_avg = s?.avg_val ?? null;
      row.peer_seoul_min = s?.min_val ?? null;
      row.peer_seoul_max = s?.max_val ?? null;

      row.peer_sgg_cnt = g?.cnt     ?? null;
      row.peer_sgg_avg = g?.avg_val ?? null;
      row.peer_sgg_min = g?.min_val ?? null;
      row.peer_sgg_max = g?.max_val ?? null;

      // 동은 5개 미만이면 신뢰도 부족 — null 처리
      row.peer_umd_cnt = (u?.cnt ?? 0) >= 5 ? (u!.cnt)     : null;
      row.peer_umd_avg = (u?.cnt ?? 0) >= 5 ? (u!.avg_val) : null;
      row.peer_umd_min = (u?.cnt ?? 0) >= 5 ? (u!.min_val) : null;
      row.peer_umd_max = (u?.cnt ?? 0) >= 5 ? (u!.max_val) : null;
    }
  } catch (e) {
    console.error('[apt-mgmt] peer group query failed:', kapt_code, e);
  }

  // Step 3: 순위 계산 — db.batch()로 10개 COUNT 쿼리를 한 번에 전송
  const total = row.total_per_hh;
  const common = row.common_per_hh;
  const personal = (total ?? 0) - (common ?? 0);

  const BASE = `billing_ym=? AND total_per_hh IS NOT NULL AND total_per_hh > 0 AND household_cnt >= 10`;
  const SEOUL = `${BASE} AND sido='서울특별시'`;
  const noRow = db.prepare(`SELECT NULL as v`);

  try {
    const ranks = await db.batch([
      /* 0 seoul_rank   */ db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${SEOUL} AND total_per_hh < ?`).bind(billing_ym, total),
      /* 1 seoul_total  */ db.prepare(`SELECT COUNT(*) as v FROM apt_mgmt_fee WHERE ${SEOUL}`).bind(billing_ym),
      /* 2 sgg_rank     */ db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${BASE} AND sgg_nm=? AND total_per_hh < ?`).bind(billing_ym, sgg, total),
      /* 3 sgg_total    */ db.prepare(`SELECT COUNT(*) as v FROM apt_mgmt_fee WHERE ${BASE} AND sgg_nm=?`).bind(billing_ym, sgg),
      /* 4 umd_rank     */ umd ? db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${BASE} AND umd_nm=? AND total_per_hh < ?`).bind(billing_ym, umd, total) : noRow,
      /* 5 umd_total    */ umd ? db.prepare(`SELECT COUNT(*) as v FROM apt_mgmt_fee WHERE ${BASE} AND umd_nm=?`).bind(billing_ym, umd) : noRow,
      /* 6 common_seoul */ db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${SEOUL} AND common_per_hh < ?`).bind(billing_ym, common),
      /* 7 common_sgg   */ db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${BASE} AND sgg_nm=? AND common_per_hh < ?`).bind(billing_ym, sgg, common),
      /* 8 pers_seoul   */ db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${SEOUL} AND (total_per_hh - COALESCE(common_per_hh,0)) < ?`).bind(billing_ym, personal),
      /* 9 pers_sgg     */ db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${BASE} AND sgg_nm=? AND (total_per_hh - COALESCE(common_per_hh,0)) < ?`).bind(billing_ym, sgg, personal),
    ]);

    const v = (i: number) => (ranks[i].results[0] as { v: number | null } | undefined)?.v ?? null;
    row.seoul_rank         = v(0);
    row.seoul_total        = v(1);
    row.sgg_rank           = v(2);
    row.sgg_total          = v(3);
    row.umd_rank           = umd ? v(4) : null;
    row.umd_total          = umd ? v(5) : null;
    row.common_seoul_rank  = v(6);
    row.common_sgg_rank    = v(7);
    row.personal_seoul_rank = v(8);
    row.personal_sgg_rank  = v(9);
  } catch (e) {
    console.error('[apt-mgmt] ranking batch failed:', kapt_code, e);
    // 순위 없이 계속 — 페이지는 정상 렌더링
  }

  if (cache) {
    try {
      await cache.put(cacheKey, JSON.stringify(row), { expirationTtl: 86400 });
    } catch (e) {
      console.error('[apt-mgmt] cache.put failed:', kapt_code, e);
    }
  }

  return row;
}

async function getD1MgmtFeeTopApts(
  db: D1Database,
  billing_ym: string,
  umd_nm: string | null,
  exclude_kapt_code: string
): Promise<{ umd: MgmtFeeTopApt | null; seoul: MgmtFeeTopApt | null }> {
  const SEOUL_SQL = `SELECT apt_nm, sgg_nm, umd_nm, kapt_code, total_per_hh
     FROM apt_mgmt_fee
     WHERE billing_ym = ? AND sido = '서울특별시'
       AND household_cnt >= 10 AND total_per_hh > 0
       AND kapt_code != ?
     ORDER BY total_per_hh ASC LIMIT 1`;

  if (!umd_nm) {
    const seoul = await db.prepare(SEOUL_SQL).bind(billing_ym, exclude_kapt_code).first<MgmtFeeTopApt>();
    return { umd: null, seoul };
  }

  // D1 Workers는 동시 쿼리 금지 → db.batch()로 한 번에 전송
  const [umdRes, seoulRes] = await db.batch<MgmtFeeTopApt>([
    db.prepare(
      `SELECT apt_nm, sgg_nm, umd_nm, kapt_code, total_per_hh
       FROM apt_mgmt_fee
       WHERE billing_ym = ? AND umd_nm = ? AND sido = '서울특별시'
         AND household_cnt >= 10 AND total_per_hh > 0
         AND kapt_code != ?
       ORDER BY total_per_hh ASC LIMIT 1`
    ).bind(billing_ym, umd_nm, exclude_kapt_code),
    db.prepare(SEOUL_SQL).bind(billing_ym, exclude_kapt_code),
  ]);

  return {
    umd: umdRes.results[0] ?? null,
    seoul: seoulRes.results[0] ?? null,
  };
}

async function getD1MgmtFeeHistory(db: D1Database, kapt_code: string): Promise<MgmtFeeHistory[]> {
  const result = await db
    .prepare(
      `SELECT billing_ym, common_per_hh, total_per_hh, household_cnt
       FROM apt_mgmt_fee
       WHERE kapt_code = ?
       ORDER BY billing_ym DESC
       LIMIT 24`
    )
    .bind(kapt_code)
    .all<MgmtFeeHistory>();
  return result.results ?? [];
}

// -------------------------
// 공개 API
// -------------------------

export async function getMgmtFeeApts(sgg_nm: string): Promise<MgmtFeeApt[]> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) return MOCK_APTS;
  return getD1MgmtFeeApts(db, sgg_nm);
}

export async function getMgmtFeeSearch(q: string): Promise<MgmtFeeApt[]> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    const lower = q.toLowerCase();
    return MOCK_APTS.filter(a => a.apt_nm.toLowerCase().includes(lower)).slice(0, 50);
  }
  return getD1MgmtFeeSearch(db, q);
}

export async function getMgmtFeeResult(kapt_code: string): Promise<MgmtFeeResult | null> {
  let db: D1Database | null = null;
  let cache: KVNamespace | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    const typedEnv = env as unknown as { DB: D1Database; CACHE?: KVNamespace };
    db = typedEnv.DB ?? null;
    cache = typedEnv.CACHE ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) return MOCK_RESULTS[kapt_code] ?? MOCK_RESULTS['A10001000'];
  try {
    return await getD1MgmtFeeResult(db, kapt_code, cache);
  } catch (e) {
    console.error('[getMgmtFeeResult] FATAL:', kapt_code, String(e), e instanceof Error ? e.stack : '');
    throw e;
  }
}

export async function getMgmtFeeAptUrlList(): Promise<{ sgg_nm: string; apt_nm: string; billing_ym: string }[]> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) return [];

  const result = await db
    .prepare(
      `SELECT DISTINCT m.sgg_nm, m.apt_nm, MAX(f.billing_ym) as billing_ym
       FROM apt_mgmt_fee f
       JOIN apt_meta m ON m.kapt_code = f.kapt_code
       WHERE m.sgg_nm IS NOT NULL AND m.apt_nm IS NOT NULL
       GROUP BY m.sgg_nm, m.apt_nm
       LIMIT 500`
    )
    .all<{ sgg_nm: string; apt_nm: string; billing_ym: string }>();
  return result.results ?? [];
}

export async function getMgmtFeeTopApts(
  billing_ym: string,
  umd_nm: string | null,
  exclude_kapt_code: string
): Promise<{ umd: MgmtFeeTopApt | null; seoul: MgmtFeeTopApt | null }> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    const toTopApt = (r: MgmtFeeResult): MgmtFeeTopApt => ({
      apt_nm: r.apt_nm,
      sgg_nm: r.sgg_nm,
      umd_nm: r.umd_nm,
      kapt_code: r.kapt_code,
      total_per_hh: r.total_per_hh ?? 0,
    });
    const candidates = Object.values(MOCK_RESULTS)
      .filter(r => r.kapt_code !== exclude_kapt_code)
      .sort((a, b) => (a.total_per_hh ?? 999999) - (b.total_per_hh ?? 999999));

    const umdCandidate = umd_nm
      ? candidates.find(r => r.umd_nm === umd_nm) ?? null
      : null;
    const seoulCandidate = candidates[0] ?? null;

    return {
      umd: umdCandidate ? toTopApt(umdCandidate) : null,
      seoul: seoulCandidate ? toTopApt(seoulCandidate) : null,
    };
  }

  return getD1MgmtFeeTopApts(db, billing_ym, umd_nm, exclude_kapt_code);
}

export async function getMgmtFeeHistory(kapt_code: string): Promise<MgmtFeeHistory[]> {
  let db: D1Database | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    db = (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    // 로컬 개발 환경
  }

  if (!db) {
    // Mock: 12개월 추이 생성
    const base = MOCK_RESULTS[kapt_code]?.common_per_hh ?? 20000;
    const totalBase = MOCK_RESULTS[kapt_code]?.total_per_hh ?? 70000;
    return Array.from({ length: 12 }, (_, i) => {
      const ym = String(202501 - i).padStart(6, '0');
      const fluctuation = 1 + (Math.sin(i * 0.8) * 0.05);
      return {
        billing_ym: ym,
        common_per_hh: Math.round(base * fluctuation),
        total_per_hh: Math.round(totalBase * fluctuation),
        household_cnt: 500,
      };
    });
  }
  return getD1MgmtFeeHistory(db, kapt_code);
}
