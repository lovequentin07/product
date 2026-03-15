/**
 * src/scripts/fetch-market-prices.ts
 * aT 연월별 도소매 가격 전체를 수집하여 파일로 저장
 *
 * 사용법:
 *   DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/fetch-market-prices.ts
 *
 * 출력: src/data/market-prices-raw.json
 */

import * as fs from 'fs';
import * as path from 'path';

const OUT_FILE = path.join(process.cwd(), 'src/data/market-prices-raw.json');
const GTE = '202403';
const LTE = '202603';
const PAGE_SIZE = 1000;

const API_KEY = process.env.DATA_GO_KR_API_KEY;
if (!API_KEY) {
  console.error('DATA_GO_KR_API_KEY 환경변수가 필요합니다');
  process.exit(1);
}

interface PriceItem {
  exmn_ym: string;
  ctgry_cd: string;
  ctgry_nm: string;
  se_cd: string;
  se_nm: string;
  item_cd: string;
  item_nm: string;
  vrty_cd: string;
  vrty_nm: string;
  grd_cd: string;
  grd_nm: string;
  unit: string;
  unit_sz: string;
  pmm_avgprc: string;
  pmm_hgprc: string;
  pmm_lwprc: string;
}

async function fetchPage(page: number): Promise<{ items: PriceItem[]; totalCount: number }> {
  const url = new URL('https://apis.data.go.kr/B552845/perYearMonth/price');
  url.searchParams.set('serviceKey', API_KEY!);
  url.searchParams.set('numOfRows', String(PAGE_SIZE));
  url.searchParams.set('pageNo', String(page));
  url.searchParams.set('cond[exmn_ym::GTE]', GTE);
  url.searchParams.set('cond[exmn_ym::LTE]', LTE);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as {
    response: {
      header: { resultCode: string; resultMsg: string };
      body: {
        totalCount: number;
        items: { item: PriceItem | PriceItem[] } | null;
      };
    };
  };

  const { resultCode, resultMsg } = data.response.header;
  if (resultCode !== '00' && resultCode !== '0') {
    throw new Error(`API 오류: ${resultCode} ${resultMsg}`);
  }

  const totalCount = data.response.body.totalCount;
  const raw = data.response.body?.items?.item;
  if (!raw) return { items: [], totalCount };
  const items = Array.isArray(raw) ? raw : [raw];
  return { items, totalCount };
}

async function main() {
  const all: PriceItem[] = [];
  let page = 1;
  let totalCount = Infinity;

  console.log(`기간: ${GTE} ~ ${LTE}`);

  while (all.length < totalCount) {
    const { items, totalCount: tc } = await fetchPage(page);
    totalCount = tc;
    all.push(...items);
    console.log(`페이지 ${page} 완료 (${all.length}/${totalCount})`);
    if (items.length === 0) break;
    page++;
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2), 'utf-8');
  console.log(`\n✅ 저장 완료: ${OUT_FILE} (${all.length}건)`);
}

main().catch(err => {
  console.error('오류:', err);
  process.exit(1);
});
