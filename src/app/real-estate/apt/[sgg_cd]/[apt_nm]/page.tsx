// src/app/real-estate/apt/[sgg_cd]/[apt_nm]/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAptHistory } from '@/lib/db/apt';
import { getRegionNameByCode } from '@/data/regions';
import AptDetailHeader from '@/components/apt-detail/AptDetailHeader';
import PriceTrendChart from '@/components/apt-detail/PriceTrendChart';
import AreaBarChart from '@/components/apt-detail/AreaBarChart';
import AptTransactionList from '@/components/apt-detail/AptTransactionList';

interface PageProps {
  params: Promise<{ sgg_cd: string; apt_nm: string }>;
  searchParams: Promise<{ deal_ymd?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sgg_cd, apt_nm } = await params;
  const aptName = decodeURIComponent(apt_nm);
  const regionName = getRegionNameByCode(sgg_cd) || '';
  const title = `${aptName} 실거래가 추이 | ${regionName} 아파트 시세 분석`;
  const description = `${aptName}의 전체 실거래가 추이, 면적별 가격, 최근 거래 이력을 한눈에 확인하세요.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

async function AptDetailContent({ sgg_cd, apt_nm, backHref }: { sgg_cd: string; apt_nm: string; backHref: string }) {
  const data = await getAptHistory(sgg_cd, apt_nm);

  if (!data) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center text-yellow-700 dark:text-yellow-300">
        <p className="font-semibold">데이터를 찾을 수 없습니다.</p>
        <p className="text-sm mt-1">아파트명이나 지역 코드를 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <AptDetailHeader data={data} backHref={backHref} />

      {/* 차트 행 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <PriceTrendChart monthly={data.monthly} />
        <AreaBarChart byArea={data.byArea} />
      </div>

      {/* 최근 거래 목록 */}
      <AptTransactionList transactions={data.recentTransactions} title="최근 거래" />

      {data.totalCount > data.recentTransactions.length && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-3">
          * D1 연결 후 전체 {data.totalCount}건의 거래 이력을 표시합니다.
        </p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg" />
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg" />
    </div>
  );
}

export default async function AptDetailPage({ params, searchParams }: PageProps) {
  const { sgg_cd, apt_nm } = await params;
  const { deal_ymd } = await searchParams;

  const aptName = decodeURIComponent(apt_nm);
  const regionName = getRegionNameByCode(sgg_cd) || sgg_cd;

  // 목록 페이지 복귀 링크 생성
  const backHref = deal_ymd
    ? `/real-estate/transaction?lawdCd=${sgg_cd}&dealYmd=${deal_ymd}`
    : `/real-estate/transaction?lawdCd=${sgg_cd}`;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="sr-only">
        <h1>{aptName} 실거래가 분석 — {regionName}</h1>
      </header>

      <Suspense fallback={<LoadingSkeleton />}>
        <AptDetailContent sgg_cd={sgg_cd} apt_nm={apt_nm} backHref={backHref} />
      </Suspense>
    </div>
  );
}
