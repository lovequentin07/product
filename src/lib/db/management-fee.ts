// src/lib/db/management-fee.ts
// 관리비 지킴이 D1 쿼리 함수

import { MgmtFeeApt, MgmtFeeResult, MgmtFeeHistory, MgmtFeeTopApt } from '@/types/management-fee';

// -------------------------
// Mock 데이터 (로컬 개발용)
// -------------------------
const MOCK_APTS: MgmtFeeApt[] = [
  { kapt_code: 'A10001000', apt_nm: '래미안대치팰리스', umd_nm: '대치동', billing_ym: '202501' },
  { kapt_code: 'A10001001', apt_nm: '은마아파트', umd_nm: '대치동', billing_ym: '202501' },
  { kapt_code: 'A10001002', apt_nm: '타워팰리스', umd_nm: '도곡동', billing_ym: '202501' },
  { kapt_code: 'A10001003', apt_nm: '개포주공', umd_nm: '개포동', billing_ym: '202501' },
  { kapt_code: 'A10001004', apt_nm: '삼성현대', umd_nm: '삼성동', billing_ym: '202501' },
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
  },
};

// -------------------------
// D1 쿼리
// -------------------------

async function getD1MgmtFeeApts(db: D1Database, sgg_nm: string): Promise<MgmtFeeApt[]> {
  const result = await db
    .prepare(
      `SELECT kapt_code, apt_nm, umd_nm, MAX(billing_ym) as billing_ym
       FROM apt_mgmt_fee
       WHERE sgg_nm = ? AND sido = '서울특별시'
       GROUP BY kapt_code
       ORDER BY apt_nm`
    )
    .bind(sgg_nm)
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
  const cacheKey = `v8:fee:${kapt_code}:${billing_ym}`;

  if (cache) {
    const cached = await cache.get(cacheKey, 'json') as MgmtFeeResult | null;
    if (cached) return cached;
  }

  // Step 1: 메인 행 + 사전집계 평균 (순위 없음 — 단순 JOIN)
  const row = await db
    .prepare(`
      SELECT f.*,
        sr_s.avg_common_per_hh   AS seoul_avg_common,
        sr_s.avg_security_per_hh AS seoul_avg_security,
        sr_s.avg_total_per_hh    AS seoul_avg_total,
        sr_g.avg_common_per_hh       AS sgg_avg_common,
        sr_g.avg_security_per_hh     AS sgg_avg_security,
        sr_g.avg_total_per_hh        AS sgg_avg_total,
        sr_g.avg_cleaning_per_hh     AS sgg_avg_cleaning,
        sr_g.avg_heating_per_hh      AS sgg_avg_heating,
        sr_g.avg_electricity_per_hh  AS sgg_avg_electricity,
        sr_g.avg_water_per_hh        AS sgg_avg_water,
        sr_g.avg_ltm_per_hh          AS sgg_avg_ltm,
        sr_g.avg_labor_per_hh        AS sgg_avg_labor,
        sr_g.avg_elevator_per_hh     AS sgg_avg_elevator,
        sr_g.avg_repair_per_hh       AS sgg_avg_repair,
        sr_g.avg_trust_mgmt_per_hh   AS sgg_avg_trust_mgmt,
        sr_g.avg_hot_water_per_hh    AS sgg_avg_hot_water,
        sr_g.avg_gas_per_hh          AS sgg_avg_gas,
        sr_g.avg_office_per_hh       AS sgg_avg_office,
        sr_g.avg_tax_per_hh          AS sgg_avg_tax,
        sr_g.avg_clothing_per_hh     AS sgg_avg_clothing,
        sr_g.avg_training_per_hh     AS sgg_avg_training,
        sr_g.avg_vehicle_per_hh      AS sgg_avg_vehicle,
        sr_g.avg_other_overhead_per_hh AS sgg_avg_other_overhead,
        sr_g.avg_disinfection_per_hh AS sgg_avg_disinfection,
        sr_g.avg_network_per_hh      AS sgg_avg_network,
        sr_g.avg_facility_per_hh     AS sgg_avg_facility,
        sr_g.avg_safety_per_hh       AS sgg_avg_safety,
        sr_g.avg_disaster_per_hh     AS sgg_avg_disaster,
        sr_g.avg_tv_per_hh           AS sgg_avg_tv,
        sr_g.avg_sewage_per_hh       AS sgg_avg_sewage,
        sr_g.avg_waste_per_hh        AS sgg_avg_waste,
        sr_g.avg_tenant_rep_per_hh   AS sgg_avg_tenant_rep,
        sr_g.avg_insurance_per_hh    AS sgg_avg_insurance,
        sr_g.avg_election_per_hh     AS sgg_avg_election,
        sr_g.avg_other_indiv_per_hh  AS sgg_avg_other_indiv,
        sr_u.avg_common_per_hh       AS umd_avg_common,
        sr_u.avg_total_per_hh        AS umd_avg_total,
        sr_u.avg_security_per_hh     AS umd_avg_security,
        sr_u.avg_cleaning_per_hh     AS umd_avg_cleaning,
        sr_u.avg_heating_per_hh      AS umd_avg_heating,
        sr_u.avg_electricity_per_hh  AS umd_avg_electricity,
        sr_u.avg_water_per_hh        AS umd_avg_water,
        sr_u.avg_ltm_per_hh          AS umd_avg_ltm,
        sr_u.avg_labor_per_hh        AS umd_avg_labor,
        sr_u.avg_elevator_per_hh     AS umd_avg_elevator,
        sr_u.avg_repair_per_hh       AS umd_avg_repair,
        sr_u.avg_trust_mgmt_per_hh   AS umd_avg_trust_mgmt,
        sr_u.avg_hot_water_per_hh    AS umd_avg_hot_water,
        sr_u.avg_gas_per_hh          AS umd_avg_gas,
        sr_u.avg_office_per_hh       AS umd_avg_office,
        sr_u.avg_tax_per_hh          AS umd_avg_tax,
        sr_u.avg_clothing_per_hh     AS umd_avg_clothing,
        sr_u.avg_training_per_hh     AS umd_avg_training,
        sr_u.avg_vehicle_per_hh      AS umd_avg_vehicle,
        sr_u.avg_other_overhead_per_hh AS umd_avg_other_overhead,
        sr_u.avg_disinfection_per_hh AS umd_avg_disinfection,
        sr_u.avg_network_per_hh      AS umd_avg_network,
        sr_u.avg_facility_per_hh     AS umd_avg_facility,
        sr_u.avg_safety_per_hh       AS umd_avg_safety,
        sr_u.avg_disaster_per_hh     AS umd_avg_disaster,
        sr_u.avg_tv_per_hh           AS umd_avg_tv,
        sr_u.avg_sewage_per_hh       AS umd_avg_sewage,
        sr_u.avg_waste_per_hh        AS umd_avg_waste,
        sr_u.avg_tenant_rep_per_hh   AS umd_avg_tenant_rep,
        sr_u.avg_insurance_per_hh    AS umd_avg_insurance,
        sr_u.avg_election_per_hh     AS umd_avg_election,
        sr_u.avg_other_indiv_per_hh  AS umd_avg_other_indiv
      FROM apt_mgmt_fee f
      LEFT JOIN apt_mgmt_fee_summary sr_s
        ON sr_s.billing_ym = ? AND sr_s.sgg_nm = '' AND sr_s.umd_nm = ''
      LEFT JOIN apt_mgmt_fee_summary sr_g
        ON sr_g.billing_ym = ? AND sr_g.sgg_nm = f.sgg_nm AND sr_g.umd_nm = ''
      LEFT JOIN apt_mgmt_fee_summary sr_u
        ON sr_u.billing_ym = ? AND sr_u.sgg_nm = f.sgg_nm
           AND sr_u.umd_nm = COALESCE(f.umd_nm, '')
      WHERE f.kapt_code = ? AND f.billing_ym = ?
    `)
    .bind(billing_ym, billing_ym, billing_ym, kapt_code, billing_ym)
    .first<Record<string, unknown>>();

  if (!row) return null;

  // Step 2: 순위 계산 — db.batch()로 10개 COUNT 쿼리를 한 번에 전송
  // 실패해도 페이지는 렌더링 (순위 섹션만 미표시)
  const total = row.total_per_hh as number | null;
  const common = row.common_per_hh as number | null;
  const sgg = row.sgg_nm as string;
  const umd = row.umd_nm as string | null;
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
    await cache.put(cacheKey, JSON.stringify(row), { expirationTtl: 86400 });
  }

  return row as unknown as MgmtFeeResult;
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
  return getD1MgmtFeeResult(db, kapt_code, cache);
}

export async function getMgmtFeeAptUrlList(): Promise<{ sgg_nm: string; apt_nm: string }[]> {
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
      `SELECT DISTINCT m.sgg_nm, m.apt_nm
       FROM apt_mgmt_fee f
       JOIN apt_meta m ON m.kapt_code = f.kapt_code
       WHERE m.sgg_nm IS NOT NULL AND m.apt_nm IS NOT NULL
       LIMIT 500`
    )
    .all<{ sgg_nm: string; apt_nm: string }>();
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

  if (!db) return [];
  return getD1MgmtFeeHistory(db, kapt_code);
}
