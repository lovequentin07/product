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
];

const MOCK_RESULT: MgmtFeeResult = {
  id: 1,
  kapt_code: 'A10001000',
  apt_nm: '래미안대치팰리스',
  sido: '서울특별시',
  sgg_nm: '강남구',
  umd_nm: '대치동',
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
  household_cnt: 1996,
  common_per_hh: 25050,
  security_per_hh: 5010,
  cleaning_per_hh: 2506,
  heating_per_hh: 12524,
  electricity_per_hh: 11523,
  water_per_hh: 5010,
  ltm_per_hh: 5010,
  total_per_hh: 70140,
  umd_rank: 3,
  umd_total: 12,
  umd_avg_common: 22000,
  sgg_rank: 45,
  sgg_total: 280,
  sgg_avg_common: 20000,
  sgg_avg_security: 4500,
  seoul_rank: 320,
  seoul_total: 3200,
  seoul_avg_common: 18000,
  seoul_avg_security: 3800,
};

// -------------------------
// D1 쿼리
// -------------------------

async function getD1MgmtFeeApts(db: D1Database, sgg_nm: string): Promise<MgmtFeeApt[]> {
  const result = await db
    .prepare(
      `SELECT kapt_code, apt_nm, umd_nm, MAX(billing_ym) as billing_ym
       FROM mgmt_fee
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
    .prepare(`SELECT MAX(billing_ym) as max_ym FROM mgmt_fee WHERE kapt_code = ?`)
    .bind(kapt_code)
    .first<{ max_ym: string }>();

  if (!latestRow?.max_ym) return null;

  const billing_ym = latestRow.max_ym;
  const cacheKey = `fee:${kapt_code}:${billing_ym}`;

  if (cache) {
    const cached = await cache.get(cacheKey, 'json') as MgmtFeeResult | null;
    if (cached) return cached;
  }

  // Window function으로 랭킹 계산 (서울 전체 단지 스캔 ~3,000건)
  const sql = `
    WITH snapshot AS (
      SELECT * FROM mgmt_fee
      WHERE billing_ym = ? AND sido = '서울특별시'
        AND common_per_hh IS NOT NULL
    )
    SELECT
      s.*,
      RANK() OVER(PARTITION BY s.umd_nm ORDER BY s.common_per_hh) as umd_rank,
      COUNT(*) OVER(PARTITION BY s.umd_nm) as umd_total,
      RANK() OVER(PARTITION BY s.sgg_nm ORDER BY s.common_per_hh) as sgg_rank,
      COUNT(*) OVER(PARTITION BY s.sgg_nm) as sgg_total,
      RANK() OVER(ORDER BY s.common_per_hh) as seoul_rank,
      COUNT(*) OVER() as seoul_total,
      AVG(s.common_per_hh) OVER() as seoul_avg_common,
      AVG(s.security_per_hh) OVER() as seoul_avg_security,
      AVG(s.common_per_hh) OVER(PARTITION BY s.sgg_nm) as sgg_avg_common,
      AVG(s.security_per_hh) OVER(PARTITION BY s.sgg_nm) as sgg_avg_security,
      AVG(s.common_per_hh) OVER(PARTITION BY s.umd_nm) as umd_avg_common
    FROM snapshot s
    WHERE s.kapt_code = ?
    LIMIT 1
  `;

  let result: D1Result<MgmtFeeResult>;
  try {
    result = await db.prepare(sql).bind(billing_ym, kapt_code).all<MgmtFeeResult>();
  } catch (e) {
    throw new Error(`D1 mgmt_fee query failed: ${(e as Error).message}`);
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
       FROM mgmt_fee
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

  if (!db) return MOCK_RESULT;
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
