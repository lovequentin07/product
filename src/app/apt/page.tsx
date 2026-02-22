// app/apt/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';

import { getTransactions } from '@/lib/db/transactions';
import { TransactionRow, TransactionQueryParams, TransactionSummary } from '@/lib/db/types';
import { getRegionNameByCode } from '@/data/regions';
import { NormalizedTransaction } from '@/types/real-estate';

import SearchForm from '@/components/apartment/SearchForm';
import TransactionsClientComponent from '@/components/apartment/TransactionsClientComponent';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface RealEstatePageProps {
  searchParams: SearchParams;
}

function ensureString(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

/** TransactionRow(DB) → NormalizedTransaction(UI 컴포넌트) 변환 */
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

/** dealYmd(YYYYMM | YYYY | 없음)를 사람이 읽기 좋은 문자열로 변환 */
function formatPeriodLabel(dealYmd?: string): string {
  if (!dealYmd) return '전체 기간';
  if (dealYmd.length === 6) return `${dealYmd.substring(0, 4)}년 ${dealYmd.substring(4, 6)}월`;
  if (dealYmd.length === 4) return `${dealYmd}년`;
  return '';
}

export async function generateMetadata({ searchParams }: RealEstatePageProps): Promise<Metadata> {
  const awaitedSearchParams = await searchParams;
  const lawdCdString = ensureString(awaitedSearchParams.lawdCd);
  const dealYmdString = ensureString(awaitedSearchParams.dealYmd);

  const regionName =
    !lawdCdString || lawdCdString === '11000'
      ? '서울'
      : (getRegionNameByCode(lawdCdString) || '선택 지역');
  const period = formatPeriodLabel(dealYmdString);
  const title = `${regionName} ${period} 아파트 실거래가 조회`;
  const description = `${title} - 국토교통부 데이터를 기반으로 한 최신 아파트 매매 정보를 확인하세요.`;
  return {
    title,
    description,
    alternates: { canonical: "/apt" },
    openGraph: { title, description, url: "/apt" },
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
  dealYmd: string; // '' = 전체 기간, 'YYYY' = 연도만, 'YYYYMM' = 연+월
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

export default async function RealEstatePage({ searchParams }: RealEstatePageProps) {
  const awaitedSearchParams = await searchParams;
  const { lawdCd, dealYmd, pageNo, numOfRows, searchTerm, sortBy, sortDir, areaMin, areaMax, priceMin, priceMax } = awaitedSearchParams;

  const initialLawdCd = ensureString(lawdCd) || '11000';
  // dealYmd: 없으면 undefined → 전체 기간 조회 (SearchForm 기본값과 일치)
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

  const searchActionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DataZip 아파트 실거래가',
    url: 'https://datazip.net',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://datazip.net/apt?searchTerm={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const regionName =
    !initialLawdCd || initialLawdCd === '11000'
      ? '서울'
      : (getRegionNameByCode(initialLawdCd) || '선택 지역');

  return (
    <div className="container mx-auto p-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionJsonLd) }}
      />
      <header className="text-center my-6">
        <h1 className="text-3xl font-bold">
          {regionName} {formatPeriodLabel(initialDealYmd)} 아파트 실거래가
        </h1>
        <p className="text-gray-500 mt-2">
          조회하고 싶은 지역과 기간을 선택하여 실시간 매매 정보를 확인하세요.
        </p>
      </header>

      <main>
        <SearchForm />

        <Suspense
          fallback={<LoadingSkeleton />}
          key={`${initialLawdCd}-${initialDealYmd || 'all'}-${initialNumOfRows}-${initialPageNo}-${initialSortBy}-${initialSortDir}-${initialSearchTerm}-${initialAreaMin ?? ''}-${initialAreaMax ?? ''}-${initialPriceMin ?? ''}-${initialPriceMax ?? ''}`}
        >
          <TransactionsLoader
            lawdCd={initialLawdCd}
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
          <p>2006년부터 현재까지 서울 전체 131만건 이상의 매매 거래 이력을 조회할 수 있습니다.</p>
          <p>
            지역(구)과 거래 연월을 선택하여 원하는 조건의 실거래 정보를 확인하고,
            아파트명 검색으로 특정 단지의 시세를 빠르게 찾을 수 있습니다.
          </p>
        </section>
      </main>
    </div>
  );
}
