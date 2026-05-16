// src/app/apt/[sgg_nm]/[apt_nm]/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getAptHistory } from '@apt/lib/db/apt';
import { getRegionCodeByName } from '@shared/data/regions';
import AptDetailHeader from '@apt/components/apt-detail/AptDetailHeader';
import AptDetailTransactionsClient from '@apt/components/apt-detail/AptDetailTransactionsClient';

const PriceTrendChart = dynamic(
  () => import('@apt/components/apt-detail/PriceTrendChart'),
  {
    loading: () => (
      <div className="animate-pulse bg-white rounded-lg border border-gray-100 p-5">
        <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
        <div className="h-56 bg-gray-100 rounded" />
      </div>
    ),
  }
);

const AreaBarChart = dynamic(
  () => import('@apt/components/apt-detail/AreaBarChart'),
  {
    loading: () => (
      <div className="animate-pulse bg-white rounded-lg border border-gray-100 p-5">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-56 bg-gray-100 rounded" />
      </div>
    ),
  }
);
import { NormalizedTransaction } from '@apt/types/real-estate';
import ServiceLayout from '@shared/components/ui/ServiceLayout';

interface PageProps {
  params: Promise<{ sgg_nm: string; apt_nm: string }>;
  searchParams: Promise<{
    deal_ymd?: string;
    pageNo?: string;
    numOfRows?: string;
    sortBy?: string;
    sortDir?: string;
    areaBucket?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sgg_nm, apt_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const aptName = decodeURIComponent(apt_nm);
  const year = new Date().getFullYear();
  const title = `${aptName} 실거래가 ${year} | ${decodedSggNm} 최신 시세`;
  const description = `${aptName} ${year}년 최신 실거래가, 면적별 시세, 거래 이력을 한눈에 확인하세요. 국토교통부 공식 데이터 기반.`;
  const canonicalUrl = `/apt/${sgg_nm}/${apt_nm}`;
  return {
    title,
    description,
    keywords: [`${aptName} 아파트`, `${aptName} 실거래가`, `${aptName} 실거래가 ${year}`, `${decodedSggNm} 아파트`, `${aptName} 시세`, `${aptName} 매매가`],
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

function toNormalized(row: import('@shared/lib/db/types').TransactionRow): NormalizedTransaction {
  return {
    id: String(row.id),
    aptName: row.apt_nm,
    price: row.deal_amount,
    area: row.exclu_use_ar,
    date: row.deal_date,
    address: row.umd_nm,
    floor: row.floor,
    buildYear: row.build_year,
    isCancelled: !!row.cdeal_type,
    sggNm: row.sgg_nm,
  };
}

async function AptDetailContent({
  sgg_cd,
  apt_nm,
  backHref,
  page,
  numOfRows,
  sortBy,
  sortDir,
  areaBucket,
}: {
  sgg_cd: string;
  apt_nm: string;
  backHref: string;
  page: number;
  numOfRows: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  areaBucket?: number;
}) {
  const data = await getAptHistory(sgg_cd, apt_nm, { page, numOfRows, sortBy, sortDir, areaBucket });

  if (!data) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center text-yellow-700">
        <p className="font-semibold">데이터를 찾을 수 없습니다.</p>
        <p className="text-sm mt-1">아파트명이나 지역 코드를 확인해주세요.</p>
      </div>
    );
  }

  const normalizedTransactions = data.recentTransactions.map(toNormalized);

  return (
    <div>
      <AptDetailHeader data={data} backHref={backHref} />

      <section className="mb-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed">
        <h2 className="sr-only">{data.aptName} 아파트 개요</h2>
        <p>
          {data.aptName} 아파트는 서울 {data.sggNm} {data.umdNm}에 위치하며,
          {data.buildYear > 0 ? ` ${data.buildYear}년에 준공되었습니다.` : ' 준공 연도 미상입니다.'}
          {' '}
          <a
            href="https://rtdown.molit.go.kr"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline hover:text-gray-800"
          >
            국토교통부 실거래가 공개시스템
          </a>
          {' '}기준 총{' '}
          <strong className="text-gray-800">
            {data.totalCount.toLocaleString()}건
          </strong>
          의 매매 거래 이력이 있습니다.
          {data.byArea.length > 0 &&
            ` 거래된 면적은 ${data.byArea.map(a => a.label).join(', ')} 등 다양한 평형대로 구성되어 있습니다.`}
        </p>
      </section>

      {/* 차트 행 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <PriceTrendChart
          monthly={data.monthly}
          byArea={data.byArea}
          sggCd={sgg_cd}
          aptNm={decodeURIComponent(apt_nm)}
        />
        <AreaBarChart byArea={data.byArea} />
      </div>

      {/* 전체 거래 목록 (페이지네이션) */}
      <AptDetailTransactionsClient
        transactions={normalizedTransactions}
        totalCount={data.totalCount}
        currentPage={data.transactionPage}
        totalPages={data.transactionTotalPages}
        itemsPerPage={numOfRows}
        sortBy={sortBy}
        sortDir={sortDir}
        sggCd={sgg_cd}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 rounded-lg" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-48 bg-gray-100 rounded-lg" />
    </div>
  );
}

export default async function AptDetailPage({ params, searchParams }: PageProps) {
  const { sgg_nm, apt_nm } = await params;
  const { deal_ymd, pageNo, numOfRows, sortBy, sortDir, areaBucket } = await searchParams;

  const decodedSggNm = decodeURIComponent(sgg_nm);
  const sgg_cd = getRegionCodeByName(decodedSggNm);
  if (!sgg_cd) notFound();

  const page = Math.max(1, parseInt(pageNo || '1', 10));
  const rows = Math.min(100, Math.max(10, parseInt(numOfRows || '20', 10)));
  const safeSortBy = sortBy || 'deal_date';
  const safeSortDir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc';
  const parsedAreaBucket = areaBucket ? Number(areaBucket) : undefined;

  const aptName = decodeURIComponent(apt_nm);

  // 목록 페이지 복귀 링크 생성 (sgg_nm 경로 파라미터 직접 사용)
  const backHref = deal_ymd
    ? `/apt/${sgg_nm}?dealYmd=${deal_ymd}`
    : `/apt/${sgg_nm}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://datazip.net' },
      { '@type': 'ListItem', position: 2, name: '실거래가 조회', item: 'https://datazip.net/apt' },
      { '@type': 'ListItem', position: 3, name: `${aptName} 실거래가`, item: `https://datazip.net/apt/${sgg_nm}/${apt_nm}` },
    ],
  };

  return (
    <ServiceLayout contentClassName="max-w-6xl mx-auto px-4 pt-6 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <AptDetailContent
          sgg_cd={sgg_cd}
          apt_nm={apt_nm}
          backHref={backHref}
          page={page}
          numOfRows={rows}
          sortBy={safeSortBy}
          sortDir={safeSortDir}
          areaBucket={parsedAreaBucket}
        />
      </Suspense>
    </ServiceLayout>
  );
}
