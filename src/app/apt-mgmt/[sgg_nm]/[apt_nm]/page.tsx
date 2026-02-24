// src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx
// 관리비 분석 결과 페이지

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getMgmtFeeResult } from '@/lib/db/management-fee';
import AptMgmtResultClient from '@/components/apt-mgmt/AptMgmtResultClient';

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

  if (!kaptCode) {
    notFound();
  }

  const result = await getMgmtFeeResult(kaptCode);

  if (!result) {
    notFound();
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://datazip.net' },
      { '@type': 'ListItem', position: 2, name: '관리비 지킴이', item: 'https://datazip.net/apt-mgmt' },
      { '@type': 'ListItem', position: 3, name: `${decodedSggNm} 관리비`, item: `https://datazip.net/apt-mgmt/${sgg_nm}` },
      { '@type': 'ListItem', position: 4, name: `${aptName} 관리비` },
    ],
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
        <Link href="/apt-mgmt" className="hover:text-gray-600 dark:hover:text-gray-300">관리비 지킴이</Link>
        <span>›</span>
        <span>{decodedSggNm}</span>
        <span>›</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium">{aptName}</span>
      </nav>

      <AptMgmtResultClient result={result} />
    </div>
  );
}
