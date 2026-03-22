/**
 * src/scripts/fetch-kapt-list.ts
 * AptListService3 API로 전국 공동주택 단지 목록을 수집하고
 * 서울 단지만 필터링하여 raw-data/kapt-list.json에 저장
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/fetch-kapt-list.ts
 *
 * 출력:
 *   raw-data/kapt-list.json  (서울 단지 배열)
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'raw-data/kapt-list.json');
const BASE_URL = 'https://apis.data.go.kr/1613000/AptListService3/getTotalAptList3';
const NUM_OF_ROWS = 1000;
const DELAY_MS = 300;

export interface KaptListItem {
  kaptCode: string;
  kaptName: string;
  as1: string;  // 시도명
  as2: string;  // 시군구명
  as3: string;  // 읍면명
  as4: string;  // 동명
  bjdCode: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPage(apiKey: string, pageNo: number): Promise<{
  items: KaptListItem[];
  totalCount: number;
}> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: String(pageNo),
    numOfRows: String(NUM_OF_ROWS),
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);

  const json = await res.json() as {
    response?: {
      body?: {
        items?: KaptListItem[] | { item?: KaptListItem | KaptListItem[] };
        totalCount?: string | number;
      };
    };
  };

  const body = json?.response?.body;
  const totalCount = parseInt(String(body?.totalCount ?? '0'), 10);

  // items가 직접 배열인 경우와 { item: [...] } 구조 모두 처리
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

async function main() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error('❌ DATA_GO_KR_API_KEY 환경변수 미설정');
    process.exit(1);
  }

  console.log('📡 AptListService3 전국 단지 목록 수집 시작...');

  // 1페이지 먼저 호출하여 totalCount 확인
  const first = await fetchPage(apiKey, 1);
  const totalCount = first.totalCount;
  const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);

  console.log(`  → 전국 총 ${totalCount}개 단지, ${totalPages}페이지`);

  const allSeoul: KaptListItem[] = [];

  // 1페이지 결과 처리
  const seoulFirst = first.items.filter(item => item.as1?.startsWith('서울'));
  allSeoul.push(...seoulFirst);
  process.stdout.write(`\r  → 1/${totalPages} 페이지 처리 (서울 누계: ${allSeoul.length})`);

  // 나머지 페이지 처리
  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    const { items } = await fetchPage(apiKey, page);
    const seoulItems = items.filter(item => item.as1?.startsWith('서울'));
    allSeoul.push(...seoulItems);
    process.stdout.write(`\r  → ${page}/${totalPages} 페이지 처리 (서울 누계: ${allSeoul.length})`);
  }

  console.log(`\n\n✅ 서울 단지 ${allSeoul.length}개 수집 완료`);

  // 저장
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSeoul, null, 2), 'utf-8');
  console.log(`💾 저장: ${OUTPUT_FILE}`);
  console.log(`👉 다음 단계: DATA_GO_KR_API_KEY=... npx tsx src/scripts/fetch-kapt-info.ts`);
}

main().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
