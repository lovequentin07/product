// src/app/apt/[sgg_nm]/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRegionCodeByName } from '@/data/regions';
import { getTransactions } from '@/lib/db/transactions';
import { TransactionRow, TransactionQueryParams, TransactionSummary } from '@/lib/db/types';
import { NormalizedTransaction } from '@/types/real-estate';

import SearchForm from '@/components/apartment/SearchForm';
import TransactionsClientComponent from '@/components/apartment/TransactionsClientComponent';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Promise<{ sgg_nm: string }>;
  searchParams: SearchParams;
}

function ensureString(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

function toNormalized(row: TransactionRow): NormalizedTransaction {
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
    sggNm: row.sgg_nm ?? undefined,
  };
}

function formatPeriodLabel(dealYmd?: string): string {
  if (!dealYmd) return '';
  if (dealYmd.length === 6) return `${dealYmd.substring(0, 4)}년 ${dealYmd.substring(4, 6)}월`;
  if (dealYmd.length === 4) return `${dealYmd}년`;
  return '';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sgg_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const title = `${decodedSggNm} 아파트 실거래가`;
  const description = `${decodedSggNm} 아파트 단지별 실거래가, 시세 추이, 거래 이력을 확인하세요. 국토교통부 공공데이터 기반.`;
  const canonicalUrl = `/apt/${sgg_nm}`;
  return {
    title,
    description,
    keywords: [
      `${decodedSggNm} 아파트`,
      `${decodedSggNm} 실거래가`,
      `${decodedSggNm} 아파트 시세`,
      `${decodedSggNm} 매매가`,
      `${decodedSggNm} 아파트 단지`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

async function TransactionsLoader({
  lawdCd,
  dealYmd,
  numOfRows,
  pageNo,
  searchTerm,
  sortBy,
  sortDir,
  areaMin,
  areaMax,
  priceMin,
  priceMax,
}: {
  lawdCd: string;
  dealYmd: string;
  numOfRows: number;
  pageNo: number;
  searchTerm: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  areaMin?: number;
  areaMax?: number;
  priceMin?: number;
  priceMax?: number;
}) {
  let transactions: NormalizedTransaction[] = [];
  let totalCount = 0;
  let summary: TransactionSummary = { avgPrice: 0, maxPrice: 0, minPrice: 0, avgPricePerPyeong: 0 };
  let error: string | null = null;

  try {
    const result = await getTransactions({
      sgg_cd: lawdCd,
      deal_ymd: dealYmd,
      page: pageNo,
      limit: numOfRows,
      apt_nm: searchTerm || undefined,
      sort_by: sortBy as TransactionQueryParams['sort_by'],
      sort_order: sortDir,
      area_min: areaMin,
      area_max: areaMax,
      price_min: priceMin,
      price_max: priceMax,
    });
    transactions = result.transactions.map(toNormalized);
    totalCount = result.totalCount;
    summary = result.summary;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <TransactionsClientComponent
      transactions={transactions}
      totalCount={totalCount}
      currentPage={pageNo}
      itemsPerPage={numOfRows}
      isLoading={false}
      error={error}
      searchTerm={searchTerm}
      sggCd={lawdCd}
      sortBy={sortBy}
      sortDir={sortDir}
      summary={summary}
      areaMin={areaMin}
      areaMax={areaMax}
      priceMin={priceMin}
      priceMax={priceMax}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex justify-center items-center h-40 text-gray-500">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      <p className="ml-3 text-lg">데이터 로딩 중...</p>
    </div>
  );
}

export default async function RegionPage({ params, searchParams }: PageProps) {
  const { sgg_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const sgg_cd = getRegionCodeByName(decodedSggNm);
  if (!sgg_cd) notFound();

  const awaitedSearchParams = await searchParams;
  const { dealYmd, pageNo, numOfRows, searchTerm, sortBy, sortDir, areaMin, areaMax, priceMin, priceMax } = awaitedSearchParams;

  const initialDealYmd = ensureString(dealYmd) || '';
  const initialNumOfRows = Number(numOfRows) || 15;
  const initialPageNo = Number(pageNo) || 1;
  const initialSearchTerm = ensureString(searchTerm) || '';
  const initialSortBy = ensureString(sortBy) || 'deal_date';
  const initialSortDir = (ensureString(sortDir) || 'desc') as 'asc' | 'desc';
  const initialAreaMin = Number(ensureString(areaMin)) || undefined;
  const initialAreaMax = Number(ensureString(areaMax)) || undefined;
  const initialPriceMin = Number(ensureString(priceMin)) || undefined;
  const initialPriceMax = Number(ensureString(priceMax)) || undefined;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://datazip.net' },
      { '@type': 'ListItem', position: 2, name: '실거래가 조회', item: 'https://datazip.net/apt' },
      { '@type': 'ListItem', position: 3, name: `${decodedSggNm} 아파트 실거래가` },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <header className="text-center my-6">
        <h1 className="text-3xl font-bold">
          {decodedSggNm} {initialDealYmd ? `${formatPeriodLabel(initialDealYmd)} ` : ''}아파트 실거래가
        </h1>
        <p className="text-gray-500 mt-2">
          조회하고 싶은 기간을 선택하여 {decodedSggNm} 실시간 매매 정보를 확인하세요.
        </p>
      </header>

      <main>
        <SearchForm initialLawdCd={sgg_cd} />

        <Suspense
          fallback={<LoadingSkeleton />}
          key={`${sgg_cd}-${initialDealYmd || 'all'}-${initialNumOfRows}-${initialPageNo}-${initialSortBy}-${initialSortDir}-${initialSearchTerm}-${initialAreaMin ?? ''}-${initialAreaMax ?? ''}-${initialPriceMin ?? ''}-${initialPriceMax ?? ''}`}
        >
          <TransactionsLoader
            lawdCd={sgg_cd}
            dealYmd={initialDealYmd}
            numOfRows={initialNumOfRows}
            pageNo={initialPageNo}
            searchTerm={initialSearchTerm}
            sortBy={initialSortBy}
            sortDir={initialSortDir}
            areaMin={initialAreaMin}
            areaMax={initialAreaMax}
            priceMin={initialPriceMin}
            priceMax={initialPriceMax}
          />
        </Suspense>

        <section className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-2 text-center">
          <p>2006년부터 현재까지 {decodedSggNm} 아파트 전체 매매 거래 이력을 조회할 수 있습니다.</p>
          <p>
            거래 연월을 선택하거나 아파트명을 검색하여 원하는 조건의 실거래 정보를 확인하세요.
          </p>
        </section>
      </main>
    </div>
  );
}
