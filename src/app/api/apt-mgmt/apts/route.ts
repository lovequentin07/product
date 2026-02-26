// src/app/api/apt-mgmt/apts/route.ts
// 구별 아파트 목록 조회 (AptMgmtSearchForm 드롭다운용)

import { NextRequest, NextResponse } from 'next/server';
import { getMgmtFeeApts } from '@/lib/db/management-fee';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sgg_nm = searchParams.get('sgg_nm');

  if (!sgg_nm) {
    return NextResponse.json({ error: 'sgg_nm 파라미터가 필요합니다.' }, { status: 400 });
  }

  try {
    const apts = await getMgmtFeeApts(sgg_nm);
    return NextResponse.json(apts, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  } catch (e) {
    console.error('[apt-mgmt/apts]', e);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
