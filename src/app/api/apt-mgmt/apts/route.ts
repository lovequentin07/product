// src/app/api/apt-mgmt/apts/route.ts
// 아파트 목록 조회 (AptMgmtSearchForm 드롭다운용)
// ?sgg_nm=강남구  → 구별 전체 목록
// ?q=래미안       → 이름 전체 검색

import { NextRequest, NextResponse } from 'next/server';
import { getMgmtFeeApts, getMgmtFeeSearch } from '@apt-mgmt/lib/db/management-fee';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sgg_nm = searchParams.get('sgg_nm');
  const q = searchParams.get('q');

  if (!sgg_nm && !q) {
    return NextResponse.json({ error: 'sgg_nm 또는 q 파라미터가 필요합니다.' }, { status: 400 });
  }

  try {
    const apts = q ? await getMgmtFeeSearch(q) : await getMgmtFeeApts(sgg_nm!);
    return NextResponse.json(apts, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  } catch (e) {
    console.error('[apt-mgmt/apts]', e);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
