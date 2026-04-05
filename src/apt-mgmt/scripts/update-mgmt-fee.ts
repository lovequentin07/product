/**
 * src/apt-mgmt/scripts/update-mgmt-fee.ts
 * K-APT 관리비 API에서 최근 N개월 데이터를 수집하여 D1을 UPSERT 방식으로 갱신합니다.
 *
 * 사용법:
 *   npx tsx src/apt-mgmt/scripts/update-mgmt-fee.ts [--dry-run]
 *
 * 환경변수:
 *   DATA_GO_KR_API_KEY    공공데이터 API 키 (필수)
 *   CLOUDFLARE_API_TOKEN  wrangler 인증 (CI 환경 필수)
 *   CLOUDFLARE_ACCOUNT_ID wrangler 계정 (CI 환경 필수)
 *   UPDATE_MONTHS         수집 월 수 (기본 2, 최대 6)
 *   CONCURRENCY           동시 처리 단지 수 (기본 5)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { fetchCommon, fetchPrivate, fetchRepair, sleep } from './fetch-kapt-mgmt';

// ─── 설정 ────────────────────────────────────────────────────────────────────

const DB_NAME = 'apt-trade-db';
const TMP_SQL_FILE = path.join(os.tmpdir(), 'mgmt_fee_update.sql');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const BATCH_SIZE = 50;  // D1 write 배치 크기 (50개 × 3KB ≈ 150KB)

const isDryRun = process.argv.includes('--dry-run');
const UPDATE_MONTHS = Math.min(6, Math.max(1, parseInt(process.env.UPDATE_MONTHS || '2', 10)));
const CONCURRENCY = Math.min(20, Math.max(1, parseInt(process.env.CONCURRENCY || '10', 10)));

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface AptMetaRow {
  kapt_code: string;
  apt_nm: string;
  sgg_nm: string;
  umd_nm: string;
  household_cnt: number | null;
}

// ─── 날짜 헬퍼 ───────────────────────────────────────────────────────────────

/** 현재 월 기준 -2개월부터 N개월 반환 (K-APT 제출 지연 반영) */
function getTargetBillingYms(): string[] {
  const result: string[] = [];
  const now = new Date();
  // -2개월 오프셋에서 시작
  for (let i = UPDATE_MONTHS + 1; i >= 2; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

// ─── 숫자 변환 ────────────────────────────────────────────────────────────────

function num(obj: Record<string, unknown> | null, ...fields: string[]): number {
  if (!obj) return 0;
  let total = 0;
  for (const f of fields) {
    const v = obj[f];
    if (v == null || v === '') continue;
    const n = parseFloat(String(v).replace(/,/g, ''));
    if (!isNaN(n)) total += n;
  }
  return Math.round(total);
}

function perHh(value: number, householdCnt: number | null): number | null {
  if (!householdCnt || householdCnt <= 0) return null;
  return Math.round(value / householdCnt);
}

function sqlNull(v: number | null): string {
  return v === null ? 'NULL' : String(v);
}

// ─── D1 apt_meta 조회 ─────────────────────────────────────────────────────────

function queryAptMeta(): AptMetaRow[] {
  const sql = `SELECT kapt_code, apt_nm, sgg_nm, umd_nm, household_cnt FROM apt_meta WHERE kapt_code IS NOT NULL`;
  try {
    const output = execSync(
      `npx wrangler d1 execute ${DB_NAME} --command "${sql.replace(/"/g, '\\"')}" --remote --json`,
      { stdio: 'pipe' }
    ).toString();
    const parsed = JSON.parse(output) as Array<{ results: Array<Record<string, unknown>> }>;
    const results = parsed[0].results;
    return results.map(row => ({
      kapt_code: String(row.kapt_code ?? ''),
      apt_nm: String(row.apt_nm ?? ''),
      sgg_nm: String(row.sgg_nm ?? ''),
      umd_nm: String(row.umd_nm ?? ''),
      household_cnt: row.household_cnt != null ? Number(row.household_cnt) : null,
    }));
  } catch (e) {
    console.error('apt_meta 조회 실패:', e);
    process.exit(1);
  }
}

// ─── SQL 생성 ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function buildUpsert(
  meta: AptMetaRow,
  ym: string,
  common: Awaited<ReturnType<typeof fetchCommon>>,
  priv: Awaited<ReturnType<typeof fetchPrivate>>,
  repair: Awaited<ReturnType<typeof fetchRepair>>,
): string {
  // ── 공용관리비 ──
  const laborCost      = num(common.laborCost, 'pay', 'sundryCost', 'bonus', 'pension', 'accidentPremium', 'employPremium', 'nationalPension', 'healthPremium', 'welfareBenefit');
  const taxFee         = num(common.taxFee, 'electCost', 'telCost', 'postageCost', 'taxrestCost');
  const vehicleCost    = num(common.vehicleCost, 'fuelCost', 'refairCost', 'carInsurance', 'carEtc');
  const otherOverhead  = num(common.etcCost, 'careItemCost', 'accountingCost', 'hiddenCost');
  const officeCost     = num(common.officeCost, 'officeSupply', 'bookSupply', 'transportCost');
  const clothingCost   = num(common.clothingCost, 'clothesCost');
  const trainingCost   = num(common.trainingCost, 'eduCost');
  const cleaningCost   = num(common.cleaningCost, 'cleanCost');
  const securityCost   = num(common.guardCost, 'guardCost');
  const disinfCost     = num(common.disinfectionCost, 'disinfCost');
  const elevatorCost   = num(common.elevatorCost, 'elevCost');
  const networkCost    = num(common.networkCost, 'hnetwCost');
  const repairCost     = num(common.repairsCost, 'lrefCost1');
  const facilityCost   = num(common.facilityMntncCost, 'lrefCost2');
  const safetyCost     = num(common.safetyCheckUpCost, 'lrefCost3');
  const disasterCost   = num(common.disasterPreventionCost, 'lrefCost4');
  const trustMgmtFee   = num(common.consignManageFee, 'manageCost');
  const commonTotal    = laborCost + taxFee + vehicleCost + otherOverhead + officeCost +
    clothingCost + trainingCost + cleaningCost + securityCost + disinfCost +
    elevatorCost + networkCost + repairCost + facilityCost + safetyCost + disasterCost + trustMgmtFee;

  // ── 개별사용료 ──
  const heatingC  = num(priv.heatCost, 'heatC');
  const heatingP  = num(priv.heatCost, 'heatP');
  const hotWaterC = num(priv.hotWaterCost, 'waterHotC');
  const hotWaterP = num(priv.hotWaterCost, 'waterHotP');
  const gasC      = num(priv.gasRentalFee, 'gasC');
  const gasP      = num(priv.gasRentalFee, 'gasP');
  const elecC     = num(priv.electricityCost, 'electC');
  const elecP     = num(priv.electricityCost, 'electP');
  const waterC    = num(priv.waterCost, 'waterCoolC');
  const waterP    = num(priv.waterCost, 'waterCoolP');
  const wasteFee  = num(priv.domesticWasteFee, 'scrap');
  const tenantRep = num(priv.representationMtg, 'preMeet');
  const insurFee  = num(priv.insuranceFee, 'buildInsu');
  const elecMng   = num(priv.electionOrpns, 'electionMng');
  const sewageFee = num(priv.purifierTankFee, 'purifi');
  const indivTotal = heatingC + heatingP + hotWaterC + hotWaterP + gasC + gasP +
    elecC + elecP + waterC + waterP + wasteFee + tenantRep + insurFee + elecMng + sewageFee;

  // ── 장기수선충당금 ──
  const ltmCharge  = num(repair.monthFee, 'sLevy');
  const ltmUse     = num(repair.monthRetalFee); // schema 미정의 — 0
  const ltmReserve = num(repair.reserveBalance, 'sTot');
  const ltmRate    = repair.accumulationTariff
    ? (() => {
        const v = repair.accumulationTariff['sPer'];
        if (v == null || v === '') return 0;
        const n = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
      })()
    : 0;

  // ── per_hh 계산 ──
  const hh = meta.household_cnt;
  const commonPerHh = perHh(commonTotal, hh);
  const securityPerHh = perHh(securityCost, hh);
  const cleaningPerHh = perHh(cleaningCost, hh);
  const heatingPerHh = perHh(heatingC + heatingP, hh);
  const electricityPerHh = perHh(elecC + elecP, hh);
  const waterPerHh = perHh(waterC + waterP, hh);
  const ltmPerHh = perHh(ltmCharge, hh);
  const totalPerHh = perHh(commonTotal + indivTotal, hh);

  const cols = `(kapt_code, apt_nm, sido, sgg_nm, umd_nm, billing_ym,
    common_mgmt_total, labor_cost, office_cost, tax_fee, clothing_cost,
    training_cost, vehicle_cost, other_overhead, cleaning_cost, security_cost,
    disinfection_cost, elevator_cost, network_cost, repair_cost, facility_cost,
    safety_cost, disaster_cost, trust_mgmt_fee,
    indiv_usage_total, heating_common, heating_indiv, hot_water_common, hot_water_indiv,
    gas_common, gas_indiv, electricity_common, electricity_indiv,
    water_common, water_indiv, tv_fee, sewage_fee, waste_fee,
    tenant_rep_cost, insurance_cost, election_cost, other_indiv,
    ltm_monthly_charge, ltm_monthly_use, ltm_total_reserve, ltm_reserve_rate, misc_income,
    household_cnt, common_per_hh, security_per_hh, cleaning_per_hh, heating_per_hh,
    electricity_per_hh, water_per_hh, ltm_per_hh, total_per_hh)`;

  const vals = `(${esc(meta.kapt_code)},${esc(meta.apt_nm)},${'\'서울특별시\''},${esc(meta.sgg_nm)},${esc(meta.umd_nm)},${esc(ym)},
    ${commonTotal},${laborCost},${officeCost},${taxFee},${clothingCost},
    ${trainingCost},${vehicleCost},${otherOverhead},${cleaningCost},${securityCost},
    ${disinfCost},${elevatorCost},${networkCost},${repairCost},${facilityCost},
    ${safetyCost},${disasterCost},${trustMgmtFee},
    ${indivTotal},${heatingC},${heatingP},${hotWaterC},${hotWaterP},
    ${gasC},${gasP},${elecC},${elecP},
    ${waterC},${waterP},0,${sewageFee},${wasteFee},
    ${tenantRep},${insurFee},${elecMng},0,
    ${ltmCharge},${ltmUse},${ltmReserve},${ltmRate},0,
    ${sqlNull(hh)},${sqlNull(commonPerHh)},${sqlNull(securityPerHh)},${sqlNull(cleaningPerHh)},${sqlNull(heatingPerHh)},
    ${sqlNull(electricityPerHh)},${sqlNull(waterPerHh)},${sqlNull(ltmPerHh)},${sqlNull(totalPerHh)})`;

  const updateSet = `common_mgmt_total=excluded.common_mgmt_total,
    labor_cost=excluded.labor_cost, office_cost=excluded.office_cost,
    tax_fee=excluded.tax_fee, clothing_cost=excluded.clothing_cost,
    training_cost=excluded.training_cost, vehicle_cost=excluded.vehicle_cost,
    other_overhead=excluded.other_overhead, cleaning_cost=excluded.cleaning_cost,
    security_cost=excluded.security_cost, disinfection_cost=excluded.disinfection_cost,
    elevator_cost=excluded.elevator_cost, network_cost=excluded.network_cost,
    repair_cost=excluded.repair_cost, facility_cost=excluded.facility_cost,
    safety_cost=excluded.safety_cost, disaster_cost=excluded.disaster_cost,
    trust_mgmt_fee=excluded.trust_mgmt_fee,
    indiv_usage_total=excluded.indiv_usage_total,
    heating_common=excluded.heating_common, heating_indiv=excluded.heating_indiv,
    hot_water_common=excluded.hot_water_common, hot_water_indiv=excluded.hot_water_indiv,
    gas_common=excluded.gas_common, gas_indiv=excluded.gas_indiv,
    electricity_common=excluded.electricity_common, electricity_indiv=excluded.electricity_indiv,
    water_common=excluded.water_common, water_indiv=excluded.water_indiv,
    sewage_fee=excluded.sewage_fee, waste_fee=excluded.waste_fee,
    tenant_rep_cost=excluded.tenant_rep_cost, insurance_cost=excluded.insurance_cost,
    election_cost=excluded.election_cost,
    ltm_monthly_charge=excluded.ltm_monthly_charge, ltm_monthly_use=excluded.ltm_monthly_use,
    ltm_total_reserve=excluded.ltm_total_reserve, ltm_reserve_rate=excluded.ltm_reserve_rate,
    household_cnt=excluded.household_cnt,
    common_per_hh=excluded.common_per_hh, security_per_hh=excluded.security_per_hh,
    cleaning_per_hh=excluded.cleaning_per_hh, heating_per_hh=excluded.heating_per_hh,
    electricity_per_hh=excluded.electricity_per_hh, water_per_hh=excluded.water_per_hh,
    ltm_per_hh=excluded.ltm_per_hh, total_per_hh=excluded.total_per_hh`;

  return `INSERT INTO apt_mgmt_fee ${cols} VALUES ${vals} ON CONFLICT(kapt_code, billing_ym) DO UPDATE SET ${updateSet};`;
}

// ─── wrangler 실행 ────────────────────────────────────────────────────────────

async function runSQL(sql: string, label: string, attempt = 1): Promise<void> {
  if (isDryRun) {
    process.stdout.write(`  [dry-run] ${label}\n`);
    return;
  }
  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');
  try {
    execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`, { stdio: 'pipe' });
  } catch (e) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      process.stdout.write(`  재시도 ${attempt}/${MAX_RETRIES - 1} (${delay / 1000}s 후)...\n`);
      await sleep(delay);
      return runSQL(sql, label, attempt + 1);
    }
    throw e;
  }
}

// ─── 단지 1개 처리 ────────────────────────────────────────────────────────────

async function processUnit(
  apiKey: string,
  meta: AptMetaRow,
  ym: string,
): Promise<string | null> {
  const [common, priv, repair] = await Promise.all([
    fetchCommon(apiKey, meta.kapt_code, ym),
    fetchPrivate(apiKey, meta.kapt_code, ym),
    fetchRepair(apiKey, meta.kapt_code, ym),
  ]);

  // 모든 응답이 null이면 데이터 없음 → skip
  const hasData = Object.values(common).some(v => v !== null) ||
    Object.values(priv).some(v => v !== null) ||
    Object.values(repair).some(v => v !== null);
  if (!hasData) return null;

  return buildUpsert(meta, ym, common, priv, repair);
}

// ─── 배치 D1 write ────────────────────────────────────────────────────────────

async function flushBatch(sqls: string[], label: string): Promise<void> {
  if (sqls.length === 0) return;
  await runSQL(sqls.join('\n'), label);
}

// ─── 병렬 처리 헬퍼 ──────────────────────────────────────────────────────────

async function runConcurrent<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error('❌ DATA_GO_KR_API_KEY 환경변수 미설정');
    process.exit(1);
  }

  const billingYms = getTargetBillingYms();
  console.log(`\n=== 관리비 데이터 업데이트 ===`);
  console.log(`대상 기간: ${billingYms[0]} ~ ${billingYms[billingYms.length - 1]} (${UPDATE_MONTHS}개월)`);
  if (isDryRun) console.log(`*** DRY RUN — D1 실행 생략 ***`);

  console.log(`\napt_meta에서 단지 목록 조회 중...`);
  const aptList = queryAptMeta();
  console.log(`단지 ${aptList.length}개 조회 완료\n`);

  let total = 0, upserted = 0, skipped = 0, failed = 0;

  for (const ym of billingYms) {
    console.log(`[${ym}] Phase 1: API 수집 시작 (${aptList.length}개 단지, 동시 ${CONCURRENCY}개)`);
    const sqls: string[] = [];
    let done = 0;

    // ── Phase 1: API 병렬 수집 ────────────────────────────────────────────────
    await runConcurrent(aptList, CONCURRENCY, async (meta) => {
      try {
        const sql = await processUnit(apiKey, meta, ym);
        if (sql !== null) { sqls.push(sql); upserted++; }
        else skipped++;
      } catch {
        failed++;
      }
      total++;
      done++;
      if (done % 200 === 0 || done === aptList.length) {
        process.stdout.write(`\r  API: ${done}/${aptList.length} (수집: ${sqls.length}, skip: ${skipped}, 실패: ${failed})`);
      }
    });

    console.log(`\n[${ym}] Phase 1 완료: ${sqls.length}개 SQL 수집\n`);

    // ── Phase 2: 배치 D1 write ────────────────────────────────────────────────
    if (sqls.length > 0) {
      const totalBatches = Math.ceil(sqls.length / BATCH_SIZE);
      console.log(`[${ym}] Phase 2: D1 write 시작 (${totalBatches}배치)`);
      for (let i = 0; i < sqls.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        await flushBatch(sqls.slice(i, i + BATCH_SIZE), `[${ym}] 배치 ${batchNum}/${totalBatches}`);
        process.stdout.write(`\r  D1: ${batchNum}/${totalBatches} 완료`);
      }
      console.log(`\n[${ym}] Phase 2 완료\n`);
    }

    console.log(`[${ym}] 완료\n`);
  }

  console.log(`\n업데이트 완료! 총 ${total}개 처리 — UPSERT: ${upserted}, skip: ${skipped}, 실패: ${failed}`);
}

main().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
