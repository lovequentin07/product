// src/lib/db/management-fee.ts
// 관리비 지킴이 D1 쿼리 함수

import { MgmtFeeApt, MgmtFeeResult, MgmtFeeHistory } from '@/types/management-fee';

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
};

// 5개 tier mock: sgg_rank/sgg_total 기준
// A: ≤20%, B: 21-40%, C: 41-60%, D: 61-80%, E: >80%
const MOCK_RESULTS: Record<string, MgmtFeeResult> = {
  // A등급: sgg 16%, seoul 10%, umd 25%
  A10001000: {
    ...MOCK_BASE,
    id: 1, kapt_code: 'A10001000', apt_nm: '래미안대치팰리스', umd_nm: '대치동',
    common_per_hh: 14000, heating_per_hh: 8000, electricity_per_hh: 7000, water_per_hh: 4000,
    total_per_hh: 45000,
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
    id: 2, kapt_code: 'A10001001', apt_nm: '은마아파트', umd_nm: '대치동',
    common_per_hh: 18500, heating_per_hh: 10000, electricity_per_hh: 9000, water_per_hh: 5000,
    total_per_hh: 58000,
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
    id: 3, kapt_code: 'A10001002', apt_nm: '타워팰리스', umd_nm: '도곡동',
    common_per_hh: 20500, heating_per_hh: 12000, electricity_per_hh: 11000, water_per_hh: 6000,
    total_per_hh: 68000,
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
    id: 4, kapt_code: 'A10001003', apt_nm: '개포주공', umd_nm: '개포동',
    common_per_hh: 25000, heating_per_hh: 15000, electricity_per_hh: 13000, water_per_hh: 7000,
    total_per_hh: 82000,
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
    id: 5, kapt_code: 'A10001004', apt_nm: '삼성현대', umd_nm: '삼성동',
    common_per_hh: 33000, heating_per_hh: 20000, electricity_per_hh: 18000, water_per_hh: 9000,
    total_per_hh: 105000,
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
  const cacheKey = `fee:${kapt_code}:${billing_ym}`;

  if (cache) {
    const cached = await cache.get(cacheKey, 'json') as MgmtFeeResult | null;
    if (cached) return cached;
  }

  // 2단계 CTE: snapshot(전체) → ranked(window 함수) → WHERE로 필터
  // 주의: window 함수는 WHERE 이후 계산되므로 반드시 분리된 CTE 필요
  const sql = `
    WITH snapshot AS (
      SELECT * FROM apt_mgmt_fee
      WHERE billing_ym = ? AND sido = '서울특별시'
        AND total_per_hh IS NOT NULL AND total_per_hh > 0
    ),
    ranked AS (
      SELECT
        s.*,
        RANK() OVER(PARTITION BY s.umd_nm ORDER BY s.total_per_hh) as umd_rank,
        COUNT(*) OVER(PARTITION BY s.umd_nm) as umd_total,
        RANK() OVER(PARTITION BY s.sgg_nm ORDER BY s.total_per_hh) as sgg_rank,
        COUNT(*) OVER(PARTITION BY s.sgg_nm) as sgg_total,
        RANK() OVER(ORDER BY s.total_per_hh) as seoul_rank,
        COUNT(*) OVER() as seoul_total,
        AVG(s.common_per_hh) OVER() as seoul_avg_common,
        AVG(s.security_per_hh) OVER() as seoul_avg_security,
        AVG(s.common_per_hh) OVER(PARTITION BY s.sgg_nm) as sgg_avg_common,
        AVG(s.security_per_hh) OVER(PARTITION BY s.sgg_nm) as sgg_avg_security,
        AVG(s.common_per_hh) OVER(PARTITION BY s.umd_nm) as umd_avg_common,
        AVG(s.total_per_hh) OVER() as seoul_avg_total,
        AVG(s.total_per_hh) OVER(PARTITION BY s.sgg_nm) as sgg_avg_total,
        RANK() OVER(ORDER BY s.common_per_hh) as common_seoul_rank,
        RANK() OVER(PARTITION BY s.sgg_nm ORDER BY s.common_per_hh) as common_sgg_rank,
        RANK() OVER(ORDER BY (s.total_per_hh - s.common_per_hh)) as personal_seoul_rank,
        RANK() OVER(PARTITION BY s.sgg_nm ORDER BY (s.total_per_hh - s.common_per_hh)) as personal_sgg_rank
      FROM snapshot s
    )
    SELECT * FROM ranked
    WHERE kapt_code = ?
    LIMIT 1
  `;

  let result: D1Result<MgmtFeeResult>;
  try {
    result = await db.prepare(sql).bind(billing_ym, kapt_code).all<MgmtFeeResult>();
  } catch (e) {
    throw new Error(`D1 apt_mgmt_fee query failed: ${(e as Error).message}`);
  }

  const row = result.results[0] ?? null;
  if (!row) return null;

  if (cache) {
    await cache.put(cacheKey, JSON.stringify(row), { expirationTtl: 86400 });
  }

  return row;
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
