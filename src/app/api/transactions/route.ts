// src/app/api/transactions/route.ts
// GET /api/transactions?sgg_cd=11710&deal_ymd=202501&page=1&limit=15&...

import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/db/transactions';
import { TransactionQueryParams } from '@/lib/db/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const sgg_cd = searchParams.get('sgg_cd');
  const deal_ymd = searchParams.get('deal_ymd');

  if (!sgg_cd || !deal_ymd) {
    return NextResponse.json(
      { error: 'sgg_cd와 deal_ymd는 필수입니다.' },
      { status: 400 }
    );
  }

  const params: TransactionQueryParams = {
    sgg_cd,
    deal_ymd,
    apt_nm: searchParams.get('apt_nm') ?? undefined,
    page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : 15,
    sort_by: (searchParams.get('sort_by') as TransactionQueryParams['sort_by']) ?? 'deal_date',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') ?? 'desc',
    area_min: searchParams.has('area_min') ? Number(searchParams.get('area_min')) : undefined,
    area_max: searchParams.has('area_max') ? Number(searchParams.get('area_max')) : undefined,
    price_min: searchParams.has('price_min') ? Number(searchParams.get('price_min')) : undefined,
    price_max: searchParams.has('price_max') ? Number(searchParams.get('price_max')) : undefined,
  };

  try {
    const result = await getTransactions(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/transactions] Error:', error);
    return NextResponse.json({ error: '데이터 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
