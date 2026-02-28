// 임시 디버그 라우트 — 에러 원인 파악 후 삭제
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const kaptCode = new URL(req.url).searchParams.get('kaptCode') ?? 'A10023709';

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    const db = (env as unknown as { DB: D1Database }).DB;

    // Step 1: MAX(billing_ym)
    let billing_ym: string;
    try {
      const latestRow = await db
        .prepare(`SELECT MAX(billing_ym) as max_ym FROM apt_mgmt_fee WHERE kapt_code = ?`)
        .bind(kaptCode)
        .first<{ max_ym: string }>();
      if (!latestRow?.max_ym) {
        return NextResponse.json({ ok: false, step: 'max_ym', error: 'null result' });
      }
      billing_ym = latestRow.max_ym;
    } catch (e) {
      return NextResponse.json({ ok: false, step: 'max_ym', error: String(e) });
    }

    // Step 2: 메인 JOIN 쿼리
    let row: Record<string, unknown> | null;
    try {
      row = await db
        .prepare(`
          SELECT f.*,
            sr_s.avg_total_per_hh AS seoul_avg_total,
            sr_g.avg_total_per_hh AS sgg_avg_total,
            sr_u.avg_total_per_hh AS umd_avg_total
          FROM apt_mgmt_fee f
          LEFT JOIN apt_mgmt_fee_summary sr_s
            ON sr_s.billing_ym = ? AND sr_s.sgg_nm = '' AND sr_s.umd_nm = ''
          LEFT JOIN apt_mgmt_fee_summary sr_g
            ON sr_g.billing_ym = ? AND sr_g.sgg_nm = f.sgg_nm AND sr_g.umd_nm = ''
          LEFT JOIN apt_mgmt_fee_summary sr_u
            ON sr_u.billing_ym = ? AND sr_u.sgg_nm = f.sgg_nm
               AND sr_u.umd_nm = COALESCE(f.umd_nm, '')
          WHERE f.kapt_code = ? AND f.billing_ym = ?
        `)
        .bind(billing_ym, billing_ym, billing_ym, kaptCode, billing_ym)
        .first<Record<string, unknown>>();
    } catch (e) {
      return NextResponse.json({ ok: false, step: 'main_query', billing_ym, error: String(e) });
    }

    if (!row) {
      return NextResponse.json({ ok: false, step: 'main_query', billing_ym, error: 'no row found' });
    }

    // Step 3: batch 랭킹
    const total = row.total_per_hh as number | null;
    const common = row.common_per_hh as number | null;
    const sgg = row.sgg_nm as string;
    const umd = row.umd_nm as string | null;
    const personal = (total ?? 0) - (common ?? 0);
    const BASE = `billing_ym=? AND total_per_hh IS NOT NULL AND total_per_hh > 0 AND household_cnt >= 10`;
    const SEOUL = `${BASE} AND sido='서울특별시'`;

    let batchResult: unknown = 'skipped';
    try {
      const ranks = await db.batch([
        db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${SEOUL} AND total_per_hh < ?`).bind(billing_ym, total),
        db.prepare(`SELECT COUNT(*) as v FROM apt_mgmt_fee WHERE ${SEOUL}`).bind(billing_ym),
        db.prepare(`SELECT COUNT(*)+1 as v FROM apt_mgmt_fee WHERE ${BASE} AND sgg_nm=? AND total_per_hh < ?`).bind(billing_ym, sgg, total),
        db.prepare(`SELECT COUNT(*) as v FROM apt_mgmt_fee WHERE ${BASE} AND sgg_nm=?`).bind(billing_ym, sgg),
      ]);
      batchResult = {
        seoul_rank: (ranks[0].results[0] as { v: number })?.v,
        seoul_total: (ranks[1].results[0] as { v: number })?.v,
        sgg_rank: (ranks[2].results[0] as { v: number })?.v,
        sgg_total: (ranks[3].results[0] as { v: number })?.v,
      };
    } catch (e) {
      batchResult = { error: String(e) };
    }

    return NextResponse.json({
      ok: true,
      billing_ym,
      total_per_hh: total,
      sgg_nm: sgg,
      umd_nm: umd,
      personal_per_hh: personal,
      batch: batchResult,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, step: 'context', error: String(e) });
  }
}
