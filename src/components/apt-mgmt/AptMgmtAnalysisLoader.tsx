'use client';
// src/components/apt-mgmt/AptMgmtAnalysisLoader.tsx
// AI 연출: 단계별 텍스트 전환 + 스피너 (순수 UX, 실제 데이터는 서버에서 이미 fetch 완료)

import { useState, useEffect } from 'react';

const STEPS = [
  { text: '데이터 수집 중...', ms: 900 },
  { text: '항목별 관리비 분석 중...', ms: 700 },
  { text: '서울 전체 랭킹 계산 중...', ms: 800 },
  { text: '분석 완료!', ms: 400 },
];

interface Props {
  onComplete: () => void;
}

export default function AptMgmtAnalysisLoader({ onComplete }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let idx = 0;
    const run = () => {
      if (idx >= STEPS.length) {
        setDone(true);
        onComplete();
        return;
      }
      setStepIdx(idx);
      setTimeout(() => {
        idx++;
        run();
      }, STEPS[idx].ms);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      {/* 스피너 */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>

      {/* 단계 텍스트 */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-all duration-300">
          {STEPS[stepIdx].text}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          AI가 관리비 데이터를 분석하고 있습니다
        </p>
      </div>

      {/* 진행 바 */}
      <div className="w-64 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* 단계 표시 */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {stepIdx + 1} / {STEPS.length}
      </p>
    </div>
  );
}
