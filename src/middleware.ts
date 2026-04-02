import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// opengraph-image 라우트는 삭제되었으나 Google이 기존 URL을 계속 크롤링 중.
// Worker 번들 로딩 전에 즉시 404를 반환하여 Cloudflare CPU timeout(5xx)을 방지.
export function middleware(_request: NextRequest) {
  return new NextResponse('Not Found', { status: 404 });
}

export const config = {
  matcher: ['/opengraph-image(.*)', '/:path*/opengraph-image(.*)'],
};
