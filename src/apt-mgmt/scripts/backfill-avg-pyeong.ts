#!/usr/bin/env npx tsx
// apt_meta의 avg_pyeong, avg_price를 apt_transactions 기반으로 백필
// 실행: CLOUDFLARE_ACCOUNT_ID=<id> CLOUDFLARE_D1_TOKEN=<token> npx tsx src/apt-mgmt/scripts/backfill-avg-pyeong.ts

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN  = process.env.CLOUDFLARE_D1_TOKEN!;
const DB_ID      = 'a65766e9-f184-4771-bbf6-4139d0f7b6a8';
const BATCH_SIZE = 50;
const SINCE_DATE = '2025-04-01'; // 최근 12개월 기준

async function d1Query(sql: string, params: (string | number | null)[] = []) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    }
  );
  const data = await res.json() as { result: { results: Record<string, unknown>[] }[] };
  return data.result?.[0]?.results ?? [];
}

async function main() {
  // 1. apt_meta 전체 조회 (kapt_code 있는 것만)
  const metas = await d1Query(
    `SELECT id, apt_nm, sgg_nm, umd_nm FROM apt_meta WHERE kapt_code IS NOT NULL ORDER BY id`
  ) as { id: number; apt_nm: string; sgg_nm: string; umd_nm: string }[];

  console.log(`총 ${metas.length}개 단지 처리 시작`);

  // 2. 배치로 avg 계산 후 UPDATE
  let updated = 0;
  for (let i = 0; i < metas.length; i += BATCH_SIZE) {
    const batch = metas.slice(i, i + BATCH_SIZE);

    for (const meta of batch) {
      const rows = await d1Query(
        `SELECT AVG(area_pyeong) as avg_p, AVG(deal_amount_billion) as avg_pr
         FROM apt_transactions
         WHERE apt_nm = ? AND sgg_nm = ? AND umd_nm = ?
           AND area_pyeong IS NOT NULL
           AND deal_amount_billion IS NOT NULL
           AND deal_type = '매매'
           AND deal_date >= ?`,
        [meta.apt_nm, meta.sgg_nm, meta.umd_nm, SINCE_DATE]
      ) as { avg_p: number | null; avg_pr: number | null }[];

      const avg_p  = rows[0]?.avg_p  ?? null;
      const avg_pr = rows[0]?.avg_pr ?? null;

      if (avg_p !== null && avg_pr !== null) {
        await d1Query(
          `UPDATE apt_meta SET avg_pyeong = ?, avg_price = ? WHERE id = ?`,
          [Math.round(avg_p), Math.round(avg_pr * 10) / 10, meta.id]
        );
        updated++;
      }
    }

    console.log(`[${i + batch.length}/${metas.length}] ${updated}개 업데이트`);
  }

  console.log(`완료: ${updated}/${metas.length}개 단지 avg_pyeong/avg_price 업데이트`);
}

main().catch(console.error);
