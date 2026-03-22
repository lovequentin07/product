/**
 * src/scripts/fetch-kapt-mgmt.ts
 * K-APT 공공 API로 관리비 데이터(공용/개별/장기수선충당금)를 수집하여
 * raw-data/kapt-mgmt/ 에 저장
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/fetch-kapt-mgmt.ts
 *
 * 파일시스템 구조:
 *   raw-data/kapt-mgmt/
 *     queue.json            ← (kaptCode, ym) 전체 조합 + 상태
 *     {kaptCode}/{ym}.json  ← 31개 엔드포인트 응답 병합 파일
 *
 * 특징:
 *   - queue.json 없으면 kapt-list.json 로드 → 최근 3개월 조합 생성
 *   - 재실행 시 pending/failed 항목만 처리 (done은 skip)
 *   - 50개 처리마다 queue.json checkpoint 저장
 *   - 공용(17)/개별(10)/장기수선(4) 3그룹 Promise.all로 병렬 호출
 */

import * as fs from 'fs';
import * as path from 'path';
import type { KaptListItem } from './fetch-kapt-list';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const KAPT_LIST_FILE = path.join(process.cwd(), 'raw-data/kapt-list.json');
const OUT_DIR = path.join(process.cwd(), 'raw-data/kapt-mgmt');
const QUEUE_FILE = path.join(OUT_DIR, 'queue.json');

const COMMON_BASE = 'https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV2';
const PRIVATE_BASE = 'https://apis.data.go.kr/1613000/AptIndvdlzManageCostServiceV2';
const REPAIR_BASE = 'https://apis.data.go.kr/1613000/AptRepairsCostServiceV2';

const INNER_DELAY_MS = 100;   // 같은 Base URL 내 순차 호출 간격
const ITEM_DELAY_MS = 200;    // 조합 간 대기
const CHECKPOINT_EVERY = 50;  // queue.json 저장 주기

// ─── 타입 ────────────────────────────────────────────────────────────────────

type ItemStatus = 'pending' | 'done' | 'failed';

interface QueueItem {
  kaptCode: string;
  ym: string;
  status: ItemStatus;
}

interface Queue {
  generatedAt: string;
  months: string[];
  total: number;
  done: number;
  failed: number;
  items: QueueItem[];
}

interface MgmtData {
  kaptCode: string;
  ym: string;
  common: {
    laborCost: Record<string, unknown> | null;
    taxFee: Record<string, unknown> | null;
    vehicleCost: Record<string, unknown> | null;
    etcCost: Record<string, unknown> | null;
    officeCost: Record<string, unknown> | null;
    clothingCost: Record<string, unknown> | null;
    trainingCost: Record<string, unknown> | null;
    cleaningCost: Record<string, unknown> | null;
    guardCost: Record<string, unknown> | null;
    disinfectionCost: Record<string, unknown> | null;
    elevatorCost: Record<string, unknown> | null;
    networkCost: Record<string, unknown> | null;
    repairsCost: Record<string, unknown> | null;
    facilityMntncCost: Record<string, unknown> | null;
    safetyCheckUpCost: Record<string, unknown> | null;
    disasterPreventionCost: Record<string, unknown> | null;
    consignManageFee: Record<string, unknown> | null;
  };
  private: {
    heatCost: Record<string, unknown> | null;
    hotWaterCost: Record<string, unknown> | null;
    gasRentalFee: Record<string, unknown> | null;
    electricityCost: Record<string, unknown> | null;
    waterCost: Record<string, unknown> | null;
    domesticWasteFee: Record<string, unknown> | null;
    representationMtg: Record<string, unknown> | null;
    insuranceFee: Record<string, unknown> | null;
    electionOrpns: Record<string, unknown> | null;
    purifierTankFee: Record<string, unknown> | null;
  };
  repair: {
    monthRetalFee: Record<string, unknown> | null;
    reserveBalance: Record<string, unknown> | null;
    accumulationTariff: Record<string, unknown> | null;
    monthFee: Record<string, unknown> | null;
  };
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 실행일 기준 직전 n개월 반환 (당월 제외). 오래된 순. */
export function getRecentMonths(n = 3): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(ym);
  }
  return months.reverse();
}

// ─── API 호출 ─────────────────────────────────────────────────────────────────

export async function callEndpoint(
  apiKey: string,
  baseUrl: string,
  endpoint: string,
  kaptCode: string,
  ym: string,
): Promise<Record<string, unknown> | null> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    kaptCode,
    searchDate: ym,
    _type: 'json',
    numOfRows: '1',
    pageNo: '1',
  });

  try {
    const res = await fetch(`${baseUrl}${endpoint}?${params}`);
    if (!res.ok) return null;

    const json = await res.json() as {
      response?: {
        body?: {
          totalCount?: string | number;
          items?: { item?: Record<string, unknown> | Record<string, unknown>[] } | Record<string, unknown>[];
          item?: Record<string, unknown>;
        };
      };
    };

    const body = json?.response?.body;
    if (!body) return null;

    // body.item 직접 접근 (이 API는 totalCount/items 래퍼 없이 item 직접 반환)
    if (body.item) return body.item as Record<string, unknown>;

    // items.item 래퍼 구조 fallback
    const items = body.items;
    if (items && !Array.isArray(items) && typeof items === 'object') {
      const item = (items as { item?: Record<string, unknown> | Record<string, unknown>[] }).item;
      if (Array.isArray(item)) return item[0] ?? null;
      return item ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

/** 공용관리비 17개 엔드포인트 순차 호출 */
export async function fetchCommon(apiKey: string, kaptCode: string, ym: string): Promise<MgmtData['common']> {
  const call = async (ep: string) => {
    const result = await callEndpoint(apiKey, COMMON_BASE, ep, kaptCode, ym);
    await sleep(INNER_DELAY_MS);
    return result;
  };

  return {
    laborCost:              await call('/getHsmpLaborCostInfoV2'),
    taxFee:                 await call('/getHsmpTaxdueInfoV2'),
    vehicleCost:            await call('/getHsmpVhcleMntncCostInfoV2'),
    etcCost:                await call('/getHsmpEtcCostInfoV2'),
    officeCost:             await call('/getHsmpOfcrkCostInfoV2'),
    clothingCost:           await call('/getHsmpClothingCostInfoV2'),
    trainingCost:           await call('/getHsmpEduTraingCostInfoV2'),
    cleaningCost:           await call('/getHsmpCleaningCostInfoV2'),
    guardCost:              await call('/getHsmpGuardCostInfoV2'),
    disinfectionCost:       await call('/getHsmpDisinfectionCostInfoV2'),
    elevatorCost:           await call('/getHsmpElevatorMntncCostInfoV2'),
    networkCost:            await call('/getHsmpHomeNetworkMntncCostInfoV2'),
    repairsCost:            await call('/getHsmpRepairsCostInfoV2'),
    facilityMntncCost:      await call('/getHsmpFacilityMntncCostInfoV2'),
    safetyCheckUpCost:      await call('/getHsmpSafetyCheckUpCostInfoV2'),
    disasterPreventionCost: await call('/getHsmpDisasterPreventionCostInfoV2'),
    consignManageFee:       await call('/getHsmpConsignManageFeeInfoV2'),
  };
}

/** 개별사용료 10개 엔드포인트 순차 호출 */
export async function fetchPrivate(apiKey: string, kaptCode: string, ym: string): Promise<MgmtData['private']> {
  const call = async (ep: string) => {
    const result = await callEndpoint(apiKey, PRIVATE_BASE, ep, kaptCode, ym);
    await sleep(INNER_DELAY_MS);
    return result;
  };

  return {
    heatCost:         await call('/getHsmpHeatCostInfoV2'),
    hotWaterCost:     await call('/getHsmpHotWaterCostInfoV2'),
    gasRentalFee:     await call('/getHsmpGasRentalFeeInfoV2'),
    electricityCost:  await call('/getHsmpElectricityCostInfoV2'),
    waterCost:        await call('/getHsmpWaterCostInfoV2'),
    domesticWasteFee: await call('/getHsmpDomesticWasteFeeInfoV2'),
    representationMtg:await call('/getHsmpMovingInRepresentationMtgInfoV2'),
    insuranceFee:     await call('/getHsmpBuildingInsuranceFeeInfoV2'),
    electionOrpns:    await call('/getHsmpElectionOrpnsInfoV2'),
    purifierTankFee:  await call('/getHsmpWaterPurifierTankFeeInfoV2'),
  };
}

/** 장기수선충당금 4개 엔드포인트 순차 호출 */
export async function fetchRepair(apiKey: string, kaptCode: string, ym: string): Promise<MgmtData['repair']> {
  const call = async (ep: string) => {
    const result = await callEndpoint(apiKey, REPAIR_BASE, ep, kaptCode, ym);
    await sleep(INNER_DELAY_MS);
    return result;
  };

  return {
    monthRetalFee:      await call('/getHsmpMonthRetalFeeInfoV2'),
    reserveBalance:     await call('/getHsmpReserveBalanceInfoV2'),
    accumulationTariff: await call('/getHsmpAccumulationTariffInfoV2'),
    monthFee:           await call('/getHsmpMonthFeeInfoV2'),
  };
}

// ─── Queue 관리 ───────────────────────────────────────────────────────────────

function saveQueue(queue: Queue): void {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
}

function loadOrCreateQueue(): Queue {
  if (fs.existsSync(QUEUE_FILE)) {
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) as Queue;
    const pending = queue.items.filter(i => i.status !== 'done').length;
    console.log(`📋 queue.json 로드 — 전체: ${queue.total}, 완료: ${queue.done}, 실패: ${queue.failed}, 남은: ${pending}`);
    return queue;
  }

  // 새로 생성
  if (!fs.existsSync(KAPT_LIST_FILE)) {
    console.error(`❌ 파일 없음: ${KAPT_LIST_FILE}`);
    console.error('   먼저 fetch-kapt-list.ts를 실행하세요.');
    process.exit(1);
  }

  const kaptList = JSON.parse(fs.readFileSync(KAPT_LIST_FILE, 'utf-8')) as KaptListItem[];
  const months = getRecentMonths(3);

  console.log(`📡 queue.json 생성 — 단지: ${kaptList.length}개, 월: ${months.join(', ')}`);

  const items: QueueItem[] = [];
  for (const { kaptCode } of kaptList) {
    for (const ym of months) {
      items.push({ kaptCode, ym, status: 'pending' });
    }
  }

  const queue: Queue = {
    generatedAt: new Date().toISOString(),
    months,
    total: items.length,
    done: 0,
    failed: 0,
    items,
  };

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  saveQueue(queue);
  console.log(`💾 queue.json 저장 — 총 ${items.length}개 조합`);

  return queue;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error('❌ DATA_GO_KR_API_KEY 환경변수 미설정');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const queue = loadOrCreateQueue();

  const pending = queue.items.filter(i => i.status === 'pending' || i.status === 'failed');
  console.log(`\n🚀 수집 시작 — pending/failed: ${pending.length}개\n`);

  let processedThisBatch = 0;

  for (let idx = 0; idx < queue.items.length; idx++) {
    const item = queue.items[idx];
    if (item.status === 'done') continue;

    const { kaptCode, ym } = item;

    try {
      // 단지/월 디렉터리 준비
      const kaptDir = path.join(OUT_DIR, kaptCode);
      if (!fs.existsSync(kaptDir)) {
        fs.mkdirSync(kaptDir, { recursive: true });
      }

      // 3 카테고리 병렬 호출
      const [common, priv, repair] = await Promise.all([
        fetchCommon(apiKey, kaptCode, ym),
        fetchPrivate(apiKey, kaptCode, ym),
        fetchRepair(apiKey, kaptCode, ym),
      ]);

      const data: MgmtData = {
        kaptCode,
        ym,
        common,
        private: priv,
        repair,
      };

      const outPath = path.join(kaptDir, `${ym}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');

      item.status = 'done';
      queue.done++;
    } catch {
      item.status = 'failed';
      queue.failed++;
    }

    processedThisBatch++;

    // 진행 상황 출력
    const processed = queue.items.filter(i => i.status !== 'pending').length;
    if (processedThisBatch % CHECKPOINT_EVERY === 0 || processed === queue.total) {
      saveQueue(queue);
      process.stdout.write(
        `\r  → ${processed}/${queue.total} (완료: ${queue.done}, 실패: ${queue.failed})`
      );
    }

    await sleep(ITEM_DELAY_MS);
  }

  // 최종 저장
  saveQueue(queue);

  console.log(`\n\n✅ 완료`);
  console.log(`   총: ${queue.total} | 완료: ${queue.done} | 실패: ${queue.failed}`);
  console.log(`💾 저장 위치: ${OUT_DIR}/`);
  console.log(`👉 다음 단계: npx tsx src/scripts/migrate-kapt-mgmt.ts`);
}

// 직접 실행 시에만 main() 호출 (import 시 실행 방지)
const isDirectRun = process.argv[1]?.endsWith('fetch-kapt-mgmt.ts') ||
  process.argv[1]?.endsWith('fetch-kapt-mgmt.js');

if (isDirectRun) {
  main().catch(err => {
    console.error('\n❌ 오류:', err);
    process.exit(1);
  });
}
