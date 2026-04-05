'use client';
// src/components/apt-mgmt/AptMgmtResultClient.tsx
// AI 연출 완료 후 결과 표시 (상태 관리)

import { useState } from 'react';
import AptMgmtAnalysisLoader from './AptMgmtAnalysisLoader';
import AptMgmtSummaryCards from './AptMgmtSummaryCards';
import AptMgmtTopAptRecommend from './AptMgmtTopAptRecommend';
import AptMgmtHistoryChart from './AptMgmtHistoryChart';
import { MgmtFeeResult, MgmtFeeTopApt, MgmtFeeHistory } from '@apt-mgmt/types/management-fee';

interface Props {
  result: MgmtFeeResult;
  topApts: { umd: MgmtFeeTopApt | null; seoul: MgmtFeeTopApt | null };
  history: MgmtFeeHistory[];
}

export default function AptMgmtResultClient({ result, topApts, history }: Props) {
  const [showResult, setShowResult] = useState(false);

  if (!showResult) {
    return <AptMgmtAnalysisLoader onComplete={() => setShowResult(true)} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Hero + 순위 바 + 진단 카드 + 비교 테이블 */}
      <AptMgmtSummaryCards result={result} />

      {/* 2. 추이 차트 — 진단 카드 바로 다음 */}
      {history.length > 0 && <AptMgmtHistoryChart history={history} />}

      {/* 3. 추천 섹션 */}
      <AptMgmtTopAptRecommend
        topApts={topApts}
        currentUmdNm={result.umd_nm}
        currentUmdRank={result.umd_rank}
        currentSeoulRank={result.seoul_rank}
      />
    </div>
  );
}
