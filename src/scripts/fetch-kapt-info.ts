/**
 * src/scripts/fetch-kapt-info.ts
 * raw-data/kapt-list.json의 서울 단지 kaptCode로
 * getAphusBassInfoV4 API를 호출하여 상세 정보를 수집
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/fetch-kapt-info.ts
 *
 * 출력:
 *   raw-data/kapt-info/{kapt_code}.json  (단지별 상세 정보)
 *
 * 특징:
 *   - 이미 저장된 파일은 skip (재실행 안전)
 *   - 200ms 딜레이 (API 부하 방지)
 */

import * as fs from 'fs';
import * as path from 'path';
import type { KaptListItem } from './fetch-kapt-list';

const KAPT_LIST_FILE = path.join(process.cwd(), 'raw-data/kapt-list.json');
const KAPT_INFO_DIR = path.join(process.cwd(), 'raw-data/kapt-info');
const BASE_URL = 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV4/getAphusBassInfoV4';
const DELAY_MS = 200;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchBassInfo(apiKey: string, kaptCode: string): Promise<Record<string, unknown> | null> {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    kaptCode,
    _type: 'json',
  });

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json() as {
      response?: { body?: { item?: Record<string, unknown> } };
    };

    return json?.response?.body?.item ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    console.error('❌ DATA_GO_KR_API_KEY 환경변수 미설정');
    process.exit(1);
  }

  if (!fs.existsSync(KAPT_LIST_FILE)) {
    console.error(`❌ 파일 없음: ${KAPT_LIST_FILE}`);
    console.error('   먼저 fetch-kapt-list.ts를 실행하세요.');
    process.exit(1);
  }

  if (!fs.existsSync(KAPT_INFO_DIR)) {
    fs.mkdirSync(KAPT_INFO_DIR, { recursive: true });
  }

  const kaptList = JSON.parse(fs.readFileSync(KAPT_LIST_FILE, 'utf-8')) as KaptListItem[];
  console.log(`📋 대상 단지: ${kaptList.length}개`);

  // 이미 수집된 파일 확인
  const existing = new Set(
    fs.readdirSync(KAPT_INFO_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('sample_'))
      .map(f => f.replace('.json', ''))
  );
  console.log(`  → 이미 수집됨: ${existing.size}개, 남은 단지: ${kaptList.length - existing.size}개`);

  let done = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of kaptList) {
    const { kaptCode } = item;

    if (existing.has(kaptCode)) {
      skipped++;
      continue;
    }

    const info = await fetchBassInfo(apiKey, kaptCode);

    if (info) {
      // kapt-list의 위치 정보와 합쳐서 저장
      const merged = {
        ...info,
        as1: item.as1,
        as2: item.as2,
        as3: item.as3,  // 동명 (as4는 null인 경우 많음)
        as4: item.as4,
        umd_nm: item.as3 ?? item.as4 ?? '',  // 동명 우선
      };
      const outPath = path.join(KAPT_INFO_DIR, `${kaptCode}.json`);
      fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8');
      done++;
    } else {
      failed++;
    }

    const total = done + failed + skipped;
    if (total % 50 === 0 || done + failed === kaptList.length - skipped) {
      process.stdout.write(
        `\r  → ${done + skipped}/${kaptList.length} 완료 (성공: ${done}, 실패: ${failed}, skip: ${skipped})`
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\n✅ 완료: ${done}개 저장, ${failed}개 실패, ${skipped}개 skip`);
  console.log(`💾 저장 위치: ${KAPT_INFO_DIR}/`);
  console.log(`👉 다음 단계: DATA_GO_KR_API_KEY=... npx tsx src/scripts/create-apt-meta.ts --remote`);
}

main().catch(err => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
