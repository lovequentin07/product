// app/real-estate/transaction/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';

import { getTransactions } from '@/lib/db/transactions';
import { TransactionRow } from '@/lib/db/types';
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
  return { title, description, openGraph: { title, description } };
}

async function TransactionsLoader({
  lawdCd,
  dealYmd,
  numOfRows,
  pageNo,
  searchTerm,
}: {
  lawdCd: string;
  dealYmd: string; // '' = 전체 기간, 'YYYY' = 연도만, 'YYYYMM' = 연+월
  numOfRows: number;
  pageNo: number;
  searchTerm: string;
}) {
  let transactions: NormalizedTransaction[] = [];
  let totalCount = 0;
  let error: string | null = null;

  try {
    const result = await getTransactions({
      sgg_cd: lawdCd,
      deal_ymd: dealYmd,
      page: pageNo,
      limit: numOfRows,
    });
    transactions = result.transactions.map(toNormalized);
    totalCount = result.totalCount;
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
  const { lawdCd, dealYmd, pageNo, numOfRows, searchTerm } = awaitedSearchParams;

  const initialLawdCd = ensureString(lawdCd) || '11000';
  // dealYmd: 없으면 undefined → 전체 기간 조회 (SearchForm 기본값과 일치)
  const initialDealYmd = ensureString(dealYmd) || '';
  const initialNumOfRows = Number(numOfRows) || 15;
  const initialPageNo = Number(pageNo) || 1;
  const initialSearchTerm = ensureString(searchTerm) || '';

  return (
    <div className="container mx-auto p-4">
      <header className="text-center my-6">
        <h1 className="text-3xl font-bold">아파트 실거래가 조회 서비스</h1>
        <p className="text-gray-500 mt-2">
          조회하고 싶은 지역과 기간을 선택하여 실시간 매매 정보를 확인하세요.
        </p>
      </header>

      <main>
        <SearchForm />

        <Suspense
          fallback={<LoadingSkeleton />}
          key={`${initialLawdCd}-${initialDealYmd || 'all'}-${initialNumOfRows}-${initialPageNo}`}
        >
          <TransactionsLoader
            lawdCd={initialLawdCd}
            dealYmd={initialDealYmd}
            numOfRows={initialNumOfRows}
            pageNo={initialPageNo}
            searchTerm={initialSearchTerm}
          />
        </Suspense>
      </main>
    </div>
  );
}
