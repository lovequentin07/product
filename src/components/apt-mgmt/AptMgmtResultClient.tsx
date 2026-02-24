'use client';
// src/components/apt-mgmt/AptMgmtResultClient.tsx
// AI 연출 완료 후 결과 표시 (상태 관리)

import { useState } from 'react';
import AptMgmtAnalysisLoader from './AptMgmtAnalysisLoader';
import AptMgmtSummaryCards from './AptMgmtSummaryCards';
import AptMgmtReportCards from './AptMgmtReportCards';
import AptMgmtComparisonTable from './AptMgmtComparisonTable';
import { MgmtFeeResult } from '@/types/management-fee';

interface Props {
  result: MgmtFeeResult;
}

export default function AptMgmtResultClient({ result }: Props) {
  const [showResult, setShowResult] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  if (!showResult) {
    return <AptMgmtAnalysisLoader onComplete={() => setShowResult(true)} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <AptMgmtSummaryCards result={result} />
      <AptMgmtReportCards result={result} />

      {/* 자세히 보기 토글 */}
      <button
        onClick={() => setShowDetail((v) => !v)}
        className="w-full text-sm text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
      >
        {showDetail ? '접기 ▲' : '자세히 보기 ▼'}
      </button>

      {showDetail && <AptMgmtComparisonTable result={result} />}

      {/* 데이터 출처 */}
      <p className="text-xs text-gray-400 text-center pb-4">
        출처:{' '}
        <a
          href="https://www.k-apt.go.kr"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline hover:text-gray-600"
        >
          K-apt 공동주택관리정보시스템
        </a>
        . 데이터 기준: {result.billing_ym.slice(0, 4)}년 {parseInt(result.billing_ym.slice(4, 6), 10)}월.
      </p>
    </div>
  );
}
