/**
 * src/scripts/fetch-market-codes.ts
 * 한국농수산식품유통공사 품목코드 전체를 1회 수집하여 파일로 저장
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/fetch-market-codes.ts
 *
 * 출력: src/data/market-codes.json
 */

import * as fs from 'fs';
import * as path from 'path';

const OUT_FILE = path.join(process.cwd(), 'src/data/market-codes.json');

interface GoodsItem {
  gds_lclsf_cd: string;
  gds_lclsf_nm: string;
  gds_mclsf_cd: string;
  gds_mclsf_nm: string;
  gds_sclsf_cd: string;
  gds_sclsf_nm: string;
}

async function fetchGoodsCodes(): Promise<GoodsItem[]> {
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) throw new Error('DATA_GO_KR_API_KEY 환경변수가 필요합니다');

  const PAGE_SIZE = 1000;
  const all: GoodsItem[] = [];
  let page = 1;
  let totalCount = Infinity;

  while (all.length < totalCount) {
    const url = new URL('https://apis.data.go.kr/B552845/katCode/goods');
    url.searchParams.set('serviceKey', serviceKey);
    url.searchParams.set('numOfRows', String(PAGE_SIZE));
    url.searchParams.set('pageNo', String(page));

    console.log(`페이지 ${page} 호출 중... (${all.length}/${totalCount === Infinity ? '?' : totalCount})`);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json() as {
      response: {
        header: { resultCode: string; resultMsg: string };
        body: {
          totalCount: number;
          numOfRows: number;
          pageNo: number;
          items: { item: GoodsItem[] };
        };
      };
    };

    const { resultCode, resultMsg } = data.response.header;
    if (resultCode !== '00' && resultCode !== '0') throw new Error(`API 오류: ${resultCode} ${resultMsg}`);

    const body = data.response.body;
    totalCount = body.totalCount;

    const pageItems = body.items?.item;
    if (!pageItems || pageItems.length === 0) break;

    all.push(...pageItems);
    page++;
  }

  console.log(`전체 품목 수: ${totalCount}, 수집: ${all.length}개`);
  return all;
}

async function main() {
  const items = await fetchGoodsCodes();

  // 대분류별 집계
  const byCategory: Record<string, { nm: string; count: number }> = {};
  for (const item of items) {
    const { gds_lclsf_cd, gds_lclsf_nm } = item;
    if (!byCategory[gds_lclsf_cd]) {
      byCategory[gds_lclsf_cd] = { nm: gds_lclsf_nm, count: 0 };
    }
    byCategory[gds_lclsf_cd].count++;
  }

  console.log('\n── 대분류별 품목 수 ──');
  for (const [cd, { nm, count }] of Object.entries(byCategory).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  )) {
    console.log(`  [${cd}] ${nm}: ${count}개`);
  }

  // 우리 10개 슬러그 후보 검색
  const candidates = ['배추', '감자', '당근', '양파', '마늘', '딸기', '사과', '고등어', '오징어', '삼겹살'];
  console.log('\n── 우리 슬러그 후보 코드 ──');
  for (const keyword of candidates) {
    const matches = items.filter((it) => it.gds_sclsf_nm.includes(keyword));
    if (matches.length === 0) {
      console.log(`  ${keyword}: 없음`);
    } else {
      for (const m of matches) {
        console.log(
          `  ${keyword}: [대${m.gds_lclsf_cd}/${m.gds_lclsf_nm}] [중${m.gds_mclsf_cd}/${m.gds_mclsf_nm}] ` +
          `[소${m.gds_sclsf_cd}/${m.gds_sclsf_nm}]`
        );
      }
    }
  }

  // 저장
  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`\n✅ 저장 완료: ${OUT_FILE} (${items.length}개)`);
}

main().catch((err) => {
  console.error('오류:', err);
  process.exit(1);
});
