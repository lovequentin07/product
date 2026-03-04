/**
 * src/scripts/sync-kapt-mgmt.ts
 * K-APT 관리비 결측치 주간 수집 스크립트 (로컬 파일 저장 전용)
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/sync-kapt-mgmt.ts [--dry-run]
 *
 * 파일시스템 구조:
 *   raw-data/kapt-info/{kaptCode}.json    ← 단지 정보 (kaptUsedate 포함)
 *   raw-data/kapt-mgmt/schedule.json      ← 결측치 추적 (이 스크립트의 핵심)
 *   raw-data/kapt-mgmt/{kaptCode}/{ym}.json ← 수집된 관리비 데이터
 *
 * 4가지 상태:
 *   pending        - 수집 필요 (제출 지연 포함, 재시도 대상)
 *   done           - 수집 완료 (JSON 파일 존재)
 *   not_registered - K-APT 미등록 단지 (3회 이상 빈 응답 → 영구 skip)
 *   too_new        - 사용승인 12개월 미만 (데이터 없음 정상)
 *
 * 재실행:
 *   schedule.json 이미 존재 → Step 1에서 신규 월만 추가, 기존 상태 보존
 *   pending 항목만 재처리 (done/not_registered/too_new는 skip)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  fetchCommon,
  fetchPrivate,
  fetchRepair,
  sleep,
  getRecentMonths,
} from './fetch-kapt-mgmt';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const KAPT_INFO_DIR = path.join(process.cwd(), 'raw-data/kapt-info');
const OUT_DIR = path.join(process.cwd(), 'raw-data/kapt-mgmt');
const SCHEDULE_FILE = path.join(OUT_DIR, 'schedule.json');

const ITEM_DELAY_MS = 200;
const CHECKPOINT_EVERY = 50;
const MONTHS_LOOKBACK = 14; // 2026-03 기준 → 2025-01까지 커버
const NOT_REGISTERED_THRESHOLD = 3;

// ─── 타입 ────────────────────────────────────────────────────────────────────

type ItemStatus = 'pending' | 'done' | 'not_registered' | 'too_new';

interface ScheduleEntry {
  status: ItemStatus;
  attempts: number;
}

interface Schedule {
  updatedAt: string;
  items: Record<string, Record<string, ScheduleEntry>>;
}

interface KaptInfo {
  kaptCode: string;
  kaptUsedate?: string;
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function loadSchedule(): Schedule {
  if (fs.existsSync(SCHEDULE_FILE)) {
    return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')) as Schedule;
  }
  return { updatedAt: new Date().toISOString(), items: {} };
}

function saveSchedule(schedule: Schedule): void {
  schedule.updatedAt = new Date().toISOString();
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2), 'utf-8');
}

function jsonFileExists(kaptCode: string, ym: string): boolean {
  return fs.existsSync(path.join(OUT_DIR, kaptCode, `${ym}.json`));
}

/** kaptUsedate(YYYYMMDD)와 ym(YYYYMM)를 비교해 사용승인 12개월 미만인지 판단 */
function isTooNew(kaptUsedate: string | undefined, ym: string): boolean {
  if (!kaptUsedate || kaptUsedate.length < 6) return false;
  const useYear = parseInt(kaptUsedate.slice(0, 4), 10);
  const useMonth = parseInt(kaptUsedate.slice(4, 6), 10);
  const ymYear = parseInt(ym.slice(0, 4), 10);
  const ymMonth = parseInt(ym.slice(4, 6), 10);
  const monthsDiff = (ymYear - useYear) * 12 + (ymMonth - useMonth);
  return monthsDiff < 12;
}

// ─── Step 1: schedule.json 갱신 ───────────────────────────────────────────────

function updateSchedule(schedule: Schedule): { newItems: number; totalKapts: number } {
  const months = getRecentMonths(MONTHS_LOOKBACK);
  const kaptInfoFiles = fs.readdirSync(KAPT_INFO_DIR).filter(f => f.endsWith('.json'));

  let newItems = 0;

  for (const file of kaptInfoFiles) {
    const info = JSON.parse(
      fs.readFileSync(path.join(KAPT_INFO_DIR, file), 'utf-8')
    ) as KaptInfo;

    const { kaptCode, kaptUsedate } = info;
    if (!kaptCode) continue;

    if (!schedule.items[kaptCode]) {
      schedule.items[kaptCode] = {};
    }

    const kaptSchedule = schedule.items[kaptCode];

    for (const ym of months) {
      const existing = kaptSchedule[ym];

      // 이미 done/not_registered → 유지
      if (existing?.status === 'done' || existing?.status === 'not_registered') {
        continue;
      }

      // JSON 파일 존재하지만 schedule에 없음(또는 pending) → done으로 등록
      if (jsonFileExists(kaptCode, ym)) {
        kaptSchedule[ym] = { status: 'done', attempts: existing?.attempts ?? 1 };
        if (!existing) newItems++;
        continue;
      }

      // too_new 판단
      if (isTooNew(kaptUsedate, ym)) {
        if (!existing) {
          kaptSchedule[ym] = { status: 'too_new', attempts: 0 };
          newItems++;
        }
        continue;
      }

      // 신규 항목 → pending
      if (!existing) {
        kaptSchedule[ym] = { status: 'pending', attempts: 0 };
        newItems++;
      }
      // 기존 too_new가 이제 12개월 초과 → pending으로 전환
      else if (existing.status === 'too_new') {
        kaptSchedule[ym] = { status: 'pending', attempts: 0 };
      }
    }
  }

  return { newItems, totalKapts: kaptInfoFiles.length };
}

// ─── Step 2: pending 항목 수집 ────────────────────────────────────────────────

async function collectPending(
  schedule: Schedule,
  apiKey: string,
  dryRun: boolean,
): Promise<void> {
  // pending 항목 수집 (최신 월 우선: 내림차순)
  const pendingList: Array<{ kaptCode: string; ym: string }> = [];

  for (const [kaptCode, yms] of Object.entries(schedule.items)) {
    for (const [ym, entry] of Object.entries(yms)) {
      if (entry.status === 'pending') {
        pendingList.push({ kaptCode, ym });
      }
    }
  }

  // 오래된 월 우선 정렬 (데이터 제출 가능성 높은 순)
  pendingList.sort((a, b) => {
    if (a.ym !== b.ym) return a.ym.localeCompare(b.ym);
    return a.kaptCode.localeCompare(b.kaptCode);
  });

  console.log(`\n🚀 수집 시작 — pending: ${pendingList.length}개`);
  if (dryRun) {
    console.log('   [--dry-run] API 호출 생략\n');
    return;
  }
  console.log('');

  let processed = 0;
  let doneCount = 0;
  let notRegisteredCount = 0;

  for (const { kaptCode, ym } of pendingList) {
    const entry = schedule.items[kaptCode][ym];

    // JSON 파일이 이미 존재하면 done 처리
    if (jsonFileExists(kaptCode, ym)) {
      entry.status = 'done';
      processed++;
      continue;
    }

    // API 호출
    const [common, priv, repair] = await Promise.all([
      fetchCommon(apiKey, kaptCode, ym),
      fetchPrivate(apiKey, kaptCode, ym),
      fetchRepair(apiKey, kaptCode, ym),
    ]);

    entry.attempts++;

    // 응답에 데이터가 하나라도 있으면 저장
    const hasData =
      Object.values(common).some(v => v !== null) ||
      Object.values(priv).some(v => v !== null) ||
      Object.values(repair).some(v => v !== null);

    if (hasData) {
      const kaptDir = path.join(OUT_DIR, kaptCode);
      if (!fs.existsSync(kaptDir)) {
        fs.mkdirSync(kaptDir, { recursive: true });
      }
      const data = { kaptCode, ym, common, private: priv, repair };
      fs.writeFileSync(
        path.join(kaptDir, `${ym}.json`),
        JSON.stringify(data, null, 2),
        'utf-8',
      );
      entry.status = 'done';
      doneCount++;
    } else {
      // 3회 이상 실패 → not_registered
      if (entry.attempts >= NOT_REGISTERED_THRESHOLD) {
        entry.status = 'not_registered';
        notRegisteredCount++;
      }
    }

    processed++;

    // 진행 출력 + checkpoint
    if (processed % CHECKPOINT_EVERY === 0 || processed === pendingList.length) {
      saveSchedule(schedule);
      process.stdout.write(
        `\r  → ${processed}/${pendingList.length} (완료: ${doneCount}, 미등록: ${notRegisteredCount})`
      );
    }

    await sleep(ITEM_DELAY_MS);
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (!dryRun && !apiKey) {
    console.error('❌ DATA_GO_KR_API_KEY 환경변수 미설정');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Step 1: schedule.json 갱신
  console.log('\n[Step 1] schedule.json 갱신 중...');
  const schedule = loadSchedule();
  const existed = fs.existsSync(SCHEDULE_FILE);
  const { newItems, totalKapts } = updateSchedule(schedule);
  saveSchedule(schedule);

  // 통계
  let pendingCount = 0, doneCount = 0, notRegisteredCount = 0, tooNewCount = 0;
  for (const yms of Object.values(schedule.items)) {
    for (const entry of Object.values(yms)) {
      if (entry.status === 'pending') pendingCount++;
      else if (entry.status === 'done') doneCount++;
      else if (entry.status === 'not_registered') notRegisteredCount++;
      else if (entry.status === 'too_new') tooNewCount++;
    }
  }

  console.log(`   단지: ${totalKapts}개, 월: 최근 ${MONTHS_LOOKBACK}개월`);
  console.log(`   ${existed ? '기존 schedule 업데이트' : '신규 schedule 생성'} — 신규 항목: ${newItems}개`);
  console.log(`   상태: pending=${pendingCount}, done=${doneCount}, not_registered=${notRegisteredCount}, too_new=${tooNewCount}`);

  // Step 2: pending 수집
  console.log('\n[Step 2] pending 항목 수집');
  await collectPending(schedule, apiKey ?? '', dryRun);

  // 최종 저장
  saveSchedule(schedule);

  // 최종 통계
  pendingCount = 0; doneCount = 0; notRegisteredCount = 0; tooNewCount = 0;
  for (const yms of Object.values(schedule.items)) {
    for (const entry of Object.values(yms)) {
      if (entry.status === 'pending') pendingCount++;
      else if (entry.status === 'done') doneCount++;
      else if (entry.status === 'not_registered') notRegisteredCount++;
      else if (entry.status === 'too_new') tooNewCount++;
    }
  }

  console.log(`\n\n✅ 완료`);
  console.log(`   pending=${pendingCount} | done=${doneCount} | not_registered=${notRegisteredCount} | too_new=${tooNewCount}`);
  console.log(`💾 schedule.json: ${SCHEDULE_FILE}`);
}

main().catch(err => {
  console.error('\n❌ 오류:', err);
  process.exit(1);
});
