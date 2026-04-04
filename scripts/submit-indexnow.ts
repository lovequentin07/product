// scripts/submit-indexnow.ts
// 사용법: npx tsx scripts/submit-indexnow.ts

const KEY = 'datazip-indexnow-2026';
const HOST = 'datazip.net';
const BASE_URL = `https://${HOST}`;

// 제출할 URL 목록 (주요 페이지 위주)
const URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/market`,
  `${BASE_URL}/apt`,
  `${BASE_URL}/apt-mgmt`,
  `${BASE_URL}/guide/apt-price-guide`,
  `${BASE_URL}/guide/mgmt-fee-guide`,
  `${BASE_URL}/guide/market-price-guide`,
  `${BASE_URL}/guide/market-shopping-guide`,
  `${BASE_URL}/about`,
  `${BASE_URL}/contact`,
];

async function submitIndexNow(urls: string[]) {
  const endpoint = 'https://searchadvisor.naver.com/indexnow';
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `${BASE_URL}/${KEY}.txt`,
    urlList: urls,
  };

  console.log(`[IndexNow] Submitting ${urls.length} URLs to Naver...`);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    console.log(`[IndexNow] Success: ${res.status}`);
  } else {
    const text = await res.text();
    console.error(`[IndexNow] Failed: ${res.status} ${text}`);
  }
}

submitIndexNow(URLS).catch(console.error);
