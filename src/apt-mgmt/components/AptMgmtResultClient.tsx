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
      <AptMgmtSummaryCards result={result} />
      {history.length > 0 && <AptMgmtHistoryChart history={history} />}
      <AptMgmtTopAptRecommend
        topApts={topApts}
        currentUmdNm={result.umd_nm}
        currentUmdRank={result.umd_rank}
        currentSeoulRank={result.seoul_rank}
      />
    </div>
  );
}
