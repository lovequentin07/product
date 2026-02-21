// src/app/api/apt/[sgg_cd]/[apt_nm]/history/route.ts
// GET /api/apt/11710/포레나송파/history?months=24

import { NextRequest, NextResponse } from 'next/server';
import { getAptHistory } from '@/lib/db/apt';

interface RouteParams {
  params: Promise<{ sgg_cd: string; apt_nm: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sgg_cd, apt_nm } = await params;
  const { searchParams } = request.nextUrl;

  const months = searchParams.has('months') ? Number(searchParams.get('months')) : 24;
  const area_bucket = searchParams.has('area_bucket') ? Number(searchParams.get('area_bucket')) : undefined;

  if (!sgg_cd || !apt_nm) {
    return NextResponse.json(
      { error: 'sgg_cd와 apt_nm은 필수입니다.' },
      { status: 400 }
    );
  }

  try {
    const result = await getAptHistory(sgg_cd, decodeURIComponent(apt_nm), months, area_bucket);
    if (!result) {
      return NextResponse.json({ error: '아파트 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/apt/history] Error:', error);
    return NextResponse.json({ error: '데이터 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
