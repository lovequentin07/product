// app/apt/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getTransactions } from '@/lib/db/transactions';
import { TransactionQueryParams, TransactionSummary } from '@/lib/db/types';
import { getRegionNameByCode } from '@/data/regions';
import { NormalizedTransaction } from '@/types/real-estate';
import { ensureString, toNormalized, formatPeriodLabel } from '@/lib/apt-utils';

import SearchForm from '@/components/apartment/SearchForm';
import TransactionsClientComponent from '@/components/apartment/TransactionsClientComponent';
import LoadingSkeleton from '@/components/apartment/LoadingSkeleton';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface RealEstatePageProps {
  searchParams: SearchParams;
}

export async function generateMetadata({ searchParams }: RealEstatePageProps): Promise<Metadata> {
  const awaitedSearchParams = await searchParams;
  const lawdCdString = ensureString(awaitedSearchParams.lawdCd);
  const dealYmdString = ensureString(awaitedSearchParams.dealYmd);

  const regionName =
    !lawdCdString || lawdCdString === '11000'
      ? '서울'
      : (getRegionNameByCode(lawdCdString) || '선택 지역');
  const period = formatPeriodLabel(dealYmdString, '전체 기간');
  const title = period ? `${regionName} ${period} 아파트 실거래가 조회` : `${regionName} 아파트 실거래가 조회`;
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

export default async function RealEstatePage({ searchParams }: RealEstatePageProps) {
  const awaitedSearchParams = await searchParams;
  const { lawdCd, dealYmd, pageNo, numOfRows, searchTerm, sortBy, sortDir, areaMin, areaMax, priceMin, priceMax } = awaitedSearchParams;

  const initialLawdCd = ensureString(lawdCd) || '11000';

  // lawdCd가 특정 구(11000 제외)이면 /apt/{sggNm}으로 redirect (하위 호환성)
  if (initialLawdCd !== '11000') {
    const sggNm = getRegionNameByCode(initialLawdCd);
    if (sggNm) {
      const qs = new URLSearchParams();
      for (const [key, val] of Object.entries(awaitedSearchParams)) {
        if (key !== 'lawdCd' && typeof val === 'string') {
          qs.set(key, val);
        }
      }
      const qsStr = qs.toString();
      redirect(`/apt/${encodeURIComponent(sggNm)}${qsStr ? `?${qsStr}` : ''}`);
    }
  }

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
          {regionName} {initialDealYmd ? `${formatPeriodLabel(initialDealYmd)} ` : ''}아파트 실거래가
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

        {/* 이런 분께 유용합니다 */}
        <section className="mt-10 text-sm text-gray-500 dark:text-gray-400 space-y-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-5 text-center">
          <h2 className="font-medium text-gray-700 dark:text-gray-300">이런 분께 유용합니다</h2>
          <ul className="space-y-1.5">
            <li>아파트 매수·매도 전 시세를 직접 확인하고 싶은 분</li>
            <li>특정 단지의 최근 거래가 추이를 파악하고 싶은 분</li>
            <li>이사 후보 지역의 아파트 가격대를 비교하고 싶은 분</li>
            <li>전세가 대비 매매가 비율(갭)을 계산하려는 분</li>
          </ul>
        </section>

        {/* FAQ */}
        <section aria-label="자주 묻는 질문" className="mt-6 space-y-1.5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">자주 묻는 질문</h2>
          <dl className="space-y-1.5">
            {[
              {
                question: "실거래가란 무엇인가요?",
                answer:
                  "실거래가는 아파트가 실제로 매매된 신고 가격입니다. 국토교통부는 부동산거래신고 등에 관한 법률에 따라 모든 아파트 거래를 실거래가로 신고하도록 의무화하고 있으며, 이 데이터를 공공에 공개합니다. 호가(매도 희망가)와 달리 실제 거래가 이루어진 금액이므로 시세를 파악하는 가장 정확한 기준입니다.",
              },
              {
                question: "데이터는 얼마나 최신인가요?",
                answer:
                  "국토교통부 실거래가 공개시스템에 신고된 데이터를 주기적으로 수집합니다. 통상 거래 계약 후 30일 이내에 신고 의무가 있어, 최신 거래는 1~2개월 후에 반영됩니다. 2006년 1월부터 현재까지 서울 전체 131만건 이상의 매매 이력을 제공합니다.",
              },
              {
                question: "실거래가를 어떻게 활용하나요?",
                answer:
                  "아파트 매매를 고려할 때 최근 3~6개월 실거래가 평균을 참고하면 적정 가격을 판단할 수 있습니다. 같은 면적대(전용면적 기준)의 거래 이력을 확인하고, 층·방향·컨디션에 따른 가격 편차도 고려하세요. 연도별 시세 흐름을 보면 해당 단지의 장기 가격 추세도 파악할 수 있습니다.",
              },
              {
                question: "시세와 실거래가는 어떻게 다른가요?",
                answer:
                  "시세는 부동산 플랫폼에서 제공하는 추정 가격으로, 실제 거래 없이 호가나 감정 평가를 기반으로 합니다. 실거래가는 실제 계약이 완료된 금액이라 더 정확합니다. 다만 매물이 적은 단지는 최근 거래 사례가 드물어 시세와 차이가 날 수 있습니다.",
              },
              {
                question: "취소된 거래도 포함되나요?",
                answer:
                  "네, 계약 해제(취소)된 거래는 별도 표시됩니다. 취소 거래는 실제 시세에 반영되지 않으므로 시세 분석 시 제외하고 참고하시기 바랍니다.",
              },
            ].map(({ question, answer }) => (
              <details
                key={question}
                className="group bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-3 font-medium text-gray-800 dark:text-gray-200 list-none">
                  <dt>{question}</dt>
                  <span className="ml-3 shrink-0 text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <dd className="px-5 pb-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{answer}</dd>
              </details>
            ))}
          </dl>
        </section>

        <section className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-2 text-center">
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
