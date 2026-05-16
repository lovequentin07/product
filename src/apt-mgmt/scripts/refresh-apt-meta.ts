/**
 * src/apt-mgmt/scripts/refresh-apt-meta.ts
 * K-APT 단지 목록을 조회하여 apt_meta에 없는 신규 서울 단지를 자동으로 추가합니다.
 *
 * 사용법:
 *   npx tsx src/apt-mgmt/scripts/refresh-apt-meta.ts
 *
 * 환경변수:
 *   DATA_GO_KR_API_KEY    공공데이터 API 키 (필수)
 *   CLOUDFLARE_API_TOKEN  wrangler 인증 (CI 환경 필수)
 *   CLOUDFLARE_ACCOUNT_ID wrangler 계정 (CI 환경 필수)
 *
 * 동작:
 *   1. K-APT AptListService3 API → 서울 전체 단지 목록
 *   2. D1 apt_meta 기존 kapt_code 조회
 *   3. 신규 kapt_code에 대해 getAphusBassInfoV4 API 호출
 *   4. D1 apt_meta UPSERT (INSERT OR IGNORE)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

const DB_NAME = 'apt-trade-db';
const TMP_SQL = path.join(os.tmpdir(), `refresh_apt_meta_${process.pid}.sql`);
const LIST_BASE = 'https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3';
const INFO_BASE = 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4';
const NUM_OF_ROWS = 1000;
const DELAY_MS = 200;
const BATCH_SIZE = 100;
const CONCURRENCY = 5;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface KaptListItem {
  kaptCode: string;
  kaptName: string;
  as1: string;
  as2: string;
  as3: string;
  as4: string;
  bjdCode: string;
}

interface KaptInfo {
  kaptCode?: string;
  kaptName?: string;
  bjdCode?: string;
  as2?: string;
  as3?: string;
  as4?: string;
  kaptdaCnt?: string | number;
  kaptDongCnt?: string | number;
  kaptUsedate?: string;
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function normalize(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

function usedateToDate(yyyymmdd: string | undefined): string | null {
  if (!yyyymmdd || yyyymmdd.length < 8) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// ─── K-APT 목록 API ──────────────────────────────────────────────────────────

async function fetchKaptPage(apiKey: string, pageNo: number): Promise<{ items: KaptListItem[]; totalCount: number }> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: String(pageNo),
    numOfRows: String(NUM_OF_ROWS),
  });
  const res = await fetch(`${LIST_BASE}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as {
    response?: { body?: { items?: KaptListItem[] | { item?: KaptListItem | KaptListItem[] }; totalCount?: string | number } };
  };
  const body = json?.response?.body;
  const totalCount = parseInt(String(body?.totalCount ?? '0'), 10);
  const rawItems = body?.items;
  let items: KaptListItem[] = [];
  if (Array.isArray(rawItems)) {
    items = rawItems;
  } else if (rawItems && typeof rawItems === 'object') {
    const nested = (rawItems as { item?: KaptListItem | KaptListItem[] }).item;
    if (Array.isArray(nested)) items = nested;
    else if (nested) items = [nested];
  }
  return { items, totalCount };
}

async function fetchAllSeoulApts(apiKey: string): Promise<KaptListItem[]> {
  console.log('K-APT 전국 단지 목록 조회 중...');
  const first = await fetchKaptPage(apiKey, 1);
  const totalPages = Math.ceil(first.totalCount / NUM_OF_ROWS);
  console.log(`  → 전국 ${first.totalCount}개, ${totalPages}페이지`);

  const seoulAll: KaptListItem[] = first.items.filter(i => i.as1?.startsWith('서울'));
  process.stdout.write(`\r  → 1/${totalPages} (서울 누계: ${seoulAll.length})`);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    const { items } = await fetchKaptPage(apiKey, page);
    seoulAll.push(...items.filter(i => i.as1?.startsWith('서울')));
    process.stdout.write(`\r  → ${page}/${totalPages} (서울 누계: ${seoulAll.length})`);
  }
  console.log(`\n서울 단지 총 ${seoulAll.length}개 조회 완료`);
  return seoulAll;
}

// ─── K-APT 상세 정보 API ──────────────────────────────────────────────────────

async function fetchKaptInfo(apiKey: string, kaptCode: string): Promise<KaptInfo | null> {
  const params = new URLSearchParams({ serviceKey: apiKey, kaptCode, _type: 'json' });
  try {
    const res = await fetch(`${INFO_BASE}?${params}`);
    if (!res.ok) return null;
    const json = await res.json() as { response?: { body?: { item?: KaptInfo } } };
    return json?.response?.body?.item ?? null;
  } catch {
    return null;
  }
}

// ─── D1 쿼리 ─────────────────────────────────────────────────────────────────

function queryD1<T>(sql: string): T[] {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  try {
    const out = execSync(
      `npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL} --remote --json`,
      { stdio: 'pipe' }
    ).toString();
    const parsed = JSON.parse(out) as Array<{ results: T[] }>;
    return parsed[0]?.results ?? [];
  } catch {
    return [];
  }
}

function runD1(sql: string): void {
  fs.writeFileSync(TMP_SQL, sql, 'utf8');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL} --remote`, { stdio: 'pipe' });
}

// ─── 병렬 처리 헬퍼 ──────────────────────────────────────────────────────────

async function runConcurrent<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      await fn(items[i++]);
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

  console.log('\n=== apt_meta 신규 단지 갱신 ===\n');

  // 1. K-APT 전체 서울 목록 조회
  const seoulApts = await fetchAllSeoulApts(apiKey);

  // 2. 기존 D1 apt_meta kapt_code 조회
  console.log('\nD1 apt_meta 기존 단지 조회 중...');
  const existing = queryD1<{ kapt_code: string }>(
    `SELECT kapt_code FROM apt_meta WHERE kapt_code IS NOT NULL`
  );
  const existingSet = new Set(existing.map(r => r.kapt_code));
  console.log(`  기존: ${existingSet.size}개`);

  // 3. 신규 단지 식별
  const newApts = seoulApts.filter(a => !existingSet.has(a.kaptCode));
  console.log(`  신규: ${newApts.length}개\n`);

  if (newApts.length === 0) {
    console.log('✅ 신규 단지 없음 — 완료');
    return;
  }

  // 4. 신규 단지 상세 정보 수집 + D1 UPSERT
  console.log(`신규 ${newApts.length}개 단지 정보 수집 중 (동시 ${CONCURRENCY}개)...`);
  const sqlBatch: string[] = [];
  let done = 0;

  await runConcurrent(newApts, CONCURRENCY, async (apt) => {
    const info = await fetchKaptInfo(apiKey, apt.kaptCode);
    if (info) {
      const sgg_cd   = apt.bjdCode?.substring(0, 5) ?? '';
      const umd_cd   = apt.bjdCode?.substring(5, 10) ?? '';
      const sgg_nm   = info.as2?.trim() ?? apt.as2 ?? '';
      const umd_nm   = (info.as3 ?? info.as4 ?? apt.as3 ?? apt.as4)?.trim() ?? '';
      const apt_nm   = normalize(info.kaptName ?? apt.kaptName);
      const hh       = Math.max(parseInt(String(info.kaptdaCnt ?? '0'), 10) || 0, 0);
      const bldg     = Math.max(parseInt(String(info.kaptDongCnt ?? '0'), 10) || 0, 0);
      const compDate = usedateToDate(info.kaptUsedate);
      const buildYr  = info.kaptUsedate ? parseInt(info.kaptUsedate.slice(0, 4)) : null;

      const cd = compDate ? `'${compDate}'` : 'NULL';
      const by = buildYr  ? String(buildYr) : 'NULL';

      sqlBatch.push(
        `INSERT OR IGNORE INTO apt_meta (kapt_code, sgg_cd, sgg_nm, umd_nm, umd_cd, apt_nm, build_year, completion_date, household_cnt, building_cnt) ` +
        `VALUES ('${esc(apt.kaptCode)}','${esc(sgg_cd)}','${esc(sgg_nm)}','${esc(umd_nm)}','${esc(umd_cd)}','${esc(apt_nm)}',${by},${cd},${hh},${bldg});`
      );
    }
    done++;
    if (done % 10 === 0 || done === newApts.length) {
      process.stdout.write(`\r  ${done}/${newApts.length} 완료 (수집: ${sqlBatch.length})`);
    }
    await sleep(DELAY_MS);
  });

  console.log(`\n\nD1 write 시작 (${sqlBatch.length}개)...`);
  for (let i = 0; i < sqlBatch.length; i += BATCH_SIZE) {
    const batch = sqlBatch.slice(i, i + BATCH_SIZE);
    runD1(batch.join('\n'));
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, sqlBatch.length)}/${sqlBatch.length} 완료`);
  }

  console.log(`\n\n✅ 완료: ${sqlBatch.length}개 신규 단지 추가`);
}

main().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
