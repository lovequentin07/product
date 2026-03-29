// src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx
// 관리비 분석 결과 페이지

import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getMgmtFeeResult, getMgmtFeeTopApts, getMgmtFeeApts } from '@apt-mgmt/lib/db/management-fee';
import type { MgmtFeeTopApt } from '@apt-mgmt/types/management-fee';
import AptMgmtResultClient from '@apt-mgmt/components/AptMgmtResultClient';

interface PageProps {
  params: Promise<{ sgg_nm: string; apt_nm: string }>;
  searchParams: Promise<{ kaptCode?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sgg_nm, apt_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const aptName = decodeURIComponent(apt_nm);
  const title = `${aptName} 관리비 비교 | ${decodedSggNm} 아파트 관리비 분석`;
  const description = `${aptName} 아파트의 관리비를 ${decodedSggNm} 평균, 서울 전체 평균과 비교 분석한 결과를 확인하세요. 경비비·청소비·난방비 등 항목별 상세 비교 제공.`;
  const canonicalUrl = `/apt-mgmt/${sgg_nm}/${apt_nm}`;
  return {
    title,
    description,
    keywords: [`${aptName} 관리비`, `${decodedSggNm} 아파트 관리비`, `${aptName} 관리비 비교`, '아파트 관리비 분석'],
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

export default async function AptMgmtDetailPage({ params, searchParams }: PageProps) {
  const { sgg_nm, apt_nm } = await params;
  const { kaptCode } = await searchParams;

  const decodedSggNm = decodeURIComponent(sgg_nm);
  const aptName = decodeURIComponent(apt_nm);

  const resolvedKaptCode = kaptCode;

  // kaptCode 없을 때: sgg_nm + apt_nm으로 DB 조회 후 리다이렉트 (SEO 크롤러 지원)
  if (!resolvedKaptCode) {
    const apts = await getMgmtFeeApts(decodedSggNm);
    const match = apts.find((a) => a.apt_nm === aptName);
    if (!match) notFound();
    redirect(`/apt-mgmt/${encodeURIComponent(decodedSggNm)}/${encodeURIComponent(aptName)}?kaptCode=${match!.kapt_code}`);
  }

  // DB 에러 시 error.tsx가 처리 (try-catch로 notFound() 하지 않음)
  const result = await getMgmtFeeResult(resolvedKaptCode!);

  if (!result) {
    notFound();
  }

  let topApts: { umd: MgmtFeeTopApt | null; seoul: MgmtFeeTopApt | null } = { umd: null, seoul: null };
  try {
    topApts = await getMgmtFeeTopApts(result.billing_ym, result.umd_nm, resolvedKaptCode!);
  } catch (e) {
    console.error('[apt-mgmt] getMgmtFeeTopApts failed:', resolvedKaptCode, e);
    // 페이지 자체는 렌더링 (추천 섹션만 미표시)
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://datazip.net' },
      { '@type': 'ListItem', position: 2, name: '관리비 지킴이', item: 'https://datazip.net/apt-mgmt' },
      { '@type': 'ListItem', position: 3, name: `${decodedSggNm} 관리비`, item: `https://datazip.net/apt-mgmt/${sgg_nm}` },
      { '@type': 'ListItem', position: 4, name: `${aptName} 관리비`, item: `https://datazip.net/apt-mgmt/${sgg_nm}/${apt_nm}` },
    ],
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5 flex-wrap">
        <Link href="/apt-mgmt" className="hover:text-gray-600">관리비 지킴이</Link>
        <span>›</span>
        <span>{decodedSggNm}</span>
        <span>›</span>
        <span className="text-gray-600 font-medium">{aptName}</span>
      </nav>

      <AptMgmtResultClient result={result} topApts={topApts} />
    </div>
  );
}
