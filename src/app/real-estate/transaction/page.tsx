// app/real-estate/transaction/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';

import { getApartmentTransactions } from '@/lib/api/apartment';
import { getRegionNameByCode } from '@/data/regions';

import SearchForm from '@/components/apartment/SearchForm';
import TransactionsClientComponent from '@/components/apartment/TransactionsClientComponent'; // Import the new client component

// SEO를 위한 동적 메타데이터 생성
export async function generateMetadata({ searchParams }: RealEstatePageProps): Promise<Metadata> {
  // Await searchParams before destructuring
  const awaitedSearchParams = await searchParams;
  const { lawdCd, dealYmd, pageNo, numOfRows } = awaitedSearchParams; // Extract new params

  if (lawdCd && dealYmd) {
    const regionName = getRegionNameByCode(lawdCd) || '선택 지역';
    const year = dealYmd.substring(0, 4);
    const month = dealYmd.substring(4, 6);
    let title = `${regionName} ${year}년 ${month}월 아파트 실거래가 조회`;
    let description = `${title} - 국토교통부 데이터를 기반으로 한 최신 아파트 매매 정보를 확인하세요.`;

    if (pageNo) {
      title += ` (페이지 ${pageNo})`;
      description += ` ${pageNo}페이지의 정보를 제공합니다.`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  }

  return {
    title: '아파트 실거래가 조회',
    description: '지역과 날짜를 선택하여 아파트 실거래가를 조회할 수 있습니다.',
  };
}

// 데이터 로딩 컴포넌트
async function TransactionsLoader({ lawdCd, dealYmd, numOfRows, pageNo }: { lawdCd: string; dealYmd: string; numOfRows: number; pageNo: number }) {
  let result = null;
  let error = null;

  try {
    result = await getApartmentTransactions(lawdCd, dealYmd, numOfRows, pageNo);
  } catch (e) {
    error = (e as Error).message;
  }
  

  return (
    <TransactionsClientComponent
      transactions={result?.transactions || []}
      totalCount={result?.totalCount || 0}
      currentPage={result?.pageNo || pageNo}
      itemsPerPage={result?.numOfRows || numOfRows}
      isLoading={false}
      error={error}
    />
  );
}

// 로딩 UI 컴포넌트
function LoadingSkeleton() {
    return (
        <div className="flex justify-center items-center h-40 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="ml-3 text-lg">데이터 로딩 중...</p>
        </div>
    );
}

export default async function RealEstatePage({ searchParams }: RealEstatePageProps) {
  // Await searchParams before destructuring
  const awaitedSearchParams = await searchParams;
  const { lawdCd, dealYmd, pageNo, numOfRows } = awaitedSearchParams; // Extract new params
  
  const now = new Date();
  const defaultDealYmd = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  
  const initialLawdCd = lawdCd || '11110'; // 기본값: 종로구
  const initialDealYmd = dealYmd || defaultDealYmd;
  const initialNumOfRows = Number(numOfRows) || 15; // Default to 15
  const initialPageNo = Number(pageNo) || 1;         // Default to 1

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
        
        <Suspense fallback={<LoadingSkeleton />} key={`${initialLawdCd}-${initialDealYmd}-${initialNumOfRows}-${initialPageNo}`}>
            <TransactionsLoader lawdCd={initialLawdCd} dealYmd={initialDealYmd} numOfRows={initialNumOfRows} pageNo={initialPageNo} />
        </Suspense>
      </main>
    </div>
  );
}
