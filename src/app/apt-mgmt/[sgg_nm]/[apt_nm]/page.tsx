// src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx
// 관리비 분석 결과 페이지

import type { Metadata } from 'next';
import Link from 'next/link';
import { getMgmtFeeResult, getMgmtFeeTopApts, getMgmtFeeApts, getMgmtFeeHistory } from '@apt-mgmt/lib/db/management-fee';
import type { MgmtFeeTopApt, MgmtFeeHistory } from '@apt-mgmt/types/management-fee';
import AptMgmtResultClient from '@apt-mgmt/components/AptMgmtResultClient';
import ServiceLayout from '@shared/components/ui/ServiceLayout';
import DataNotFound from '@shared/components/ui/DataNotFound';

interface PageProps {
  params: Promise<{ sgg_nm: string; apt_nm: string }>;
  searchParams: Promise<{ kaptCode?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sgg_nm, apt_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const aptName = decodeURIComponent(apt_nm);
  const year = new Date().getFullYear();
  const title = `${aptName} 관리비 — ${decodedSggNm} 평균 대비 얼마? (${year})`;
  const description = `${aptName} 세대당 월 관리비가 ${decodedSggNm} 평균보다 비싼지 즉시 확인. 경비비·청소비·난방비 항목별 금액과 절감 가능 항목 분석 제공.`;
  const canonicalUrl = `/apt-mgmt/${sgg_nm}/${apt_nm}`;
  return {
    title,
    description,
    keywords: [`${aptName} 관리비`, `${decodedSggNm} 아파트 관리비`, `${aptName} 관리비 ${year}`, '아파트 관리비 조회', `${aptName} 관리비 조회`],
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

export default async function AptMgmtDetailPage({ params, searchParams }: PageProps) {
  const { sgg_nm, apt_nm } = await params;
  const { kaptCode } = await searchParams;

  const decodedSggNm = decodeURIComponent(sgg_nm);
  const aptName = decodeURIComponent(apt_nm);

  const NOT_FOUND_PROPS = {
    title: `${aptName} 관리비 정보를 찾을 수 없습니다`,
    message: '해당 아파트의 관리비 데이터가 국토교통부 K-apt 공시 DB에 아직 수집되지 않았습니다.',
    source: '국토교통부 K-apt',
    backHref: '/apt-mgmt',
    backLabel: '관리비 검색으로 돌아가기',
  } as const;

  // kaptCode resolve: URL에 없으면 DB에서 조회 (redirect 없이 직접 렌더링)
  let resolvedKaptCode = kaptCode;
  if (!resolvedKaptCode) {
    try {
      const apts = await getMgmtFeeApts(decodedSggNm);
      const match = apts.find((a) => a.apt_nm === aptName);
      if (!match) return (
        <ServiceLayout>
          <DataNotFound {...NOT_FOUND_PROPS} />
        </ServiceLayout>
      );
      resolvedKaptCode = match.kapt_code;
    } catch (e) {
      console.error('[apt-mgmt] getMgmtFeeApts failed:', decodedSggNm, aptName, e);
      return (
        <ServiceLayout>
          <DataNotFound {...NOT_FOUND_PROPS} />
        </ServiceLayout>
      );
    }
  }

  // 관리비 결과 조회
  let result = null;
  try {
    result = await getMgmtFeeResult(resolvedKaptCode);
  } catch (e) {
    console.error('[apt-mgmt] getMgmtFeeResult failed:', resolvedKaptCode, e);
    return (
      <ServiceLayout>
        <DataNotFound {...NOT_FOUND_PROPS} />
      </ServiceLayout>
    );
  }

  if (!result) {
    return (
      <ServiceLayout>
        <DataNotFound {...NOT_FOUND_PROPS} />
      </ServiceLayout>
    );
  }

  let topApts: { umd: MgmtFeeTopApt | null; seoul: MgmtFeeTopApt | null } = { umd: null, seoul: null };
  try {
    topApts = await getMgmtFeeTopApts(result.billing_ym, result.umd_nm, resolvedKaptCode);
  } catch (e) {
    console.error('[apt-mgmt] getMgmtFeeTopApts failed:', resolvedKaptCode, e);
    // 추천 섹션 미표시로 계속
  }

  let history: MgmtFeeHistory[] = [];
  try {
    history = await getMgmtFeeHistory(resolvedKaptCode);
  } catch (e) {
    console.error('[apt-mgmt] getMgmtFeeHistory failed:', resolvedKaptCode, e);
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
    <ServiceLayout>
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

      <AptMgmtResultClient result={result} topApts={topApts} history={history} />
    </ServiceLayout>
  );
}
