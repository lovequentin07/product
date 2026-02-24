'use client';
// src/components/apt-mgmt/AptMgmtResultClient.tsx
// AI 연출 완료 후 결과 표시 (상태 관리)

import { useState } from 'react';
import AptMgmtAnalysisLoader from './AptMgmtAnalysisLoader';
import AptMgmtSummaryCards from './AptMgmtSummaryCards';
import { MgmtFeeResult } from '@/types/management-fee';

interface Props {
  result: MgmtFeeResult;
}

export default function AptMgmtResultClient({ result }: Props) {
  const [showResult, setShowResult] = useState(false);

  if (!showResult) {
    return <AptMgmtAnalysisLoader onComplete={() => setShowResult(true)} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <AptMgmtSummaryCards result={result} />
    </div>
  );
}
