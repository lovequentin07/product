// src/components/apt-mgmt/AptMgmtSummaryCards.tsx

import { MgmtFeeResult } from '@/types/management-fee';
import { type Tier, tierConfig } from './summaryConfig';
import AptMgmtShareButtons from './AptMgmtShareButtons';

interface Props {
  result: MgmtFeeResult;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

function toTier(rank: number | null, total: number | null): Tier | null {
  if (!rank || !total) return null;
  const pct = (rank / total) * 100;
  if (pct <= 20) return 'A';
  if (pct <= 40) return 'B';
  if (pct <= 60) return 'C';
  if (pct <= 80) return 'D';
  return 'E';
}

// 절약 점수: 높을수록 좋음 (fill 높으면 바 길게 = 직관적)
function rankScore(rank: number | null, total: number | null): number {
  if (!rank || !total) return 50;
  return Math.round(((total - rank + 1) / total) * 100);
}

// 점수에 따른 바 색상: 높으면 초록, 낮으면 빨강
function scoreColor(score: number): string {
  if (score >= 67) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-500';
}

interface BarRowProps {
  label: string;
  dotColor: string;
  score: number;  // 0~100 (높을수록 좋음)
}

function BarRow({ label, dotColor, score }: BarRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-[6.5rem] sm:w-28 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-12 text-right shrink-0">
        {score}점
      </span>
    </div>
  );
}

interface CompareRowProps {
  label: string;
  amount: number | null;
  sggAvg: number | null;
}

function CompareRow({ label, amount, sggAvg }: CompareRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
        {label}
      </span>
      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 text-right whitespace-nowrap">
        {amount != null ? `${amount.toLocaleString()}원` : '-'}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 text-right whitespace-nowrap">
        {sggAvg != null ? `${Math.round(sggAvg).toLocaleString()}원` : '-'}
      </span>
    </div>
  );
}

export default function AptMgmtSummaryCards({ result }: Props) {
  // 기준 결정: umd_total >= 5이면 동 기준, 아니면 구 기준 fallback
  const useUmd = (result.umd_total ?? 0) >= 5;
  const activeRank  = useUmd ? result.umd_rank  : result.sgg_rank;
  const activeTotal = useUmd ? result.umd_total : result.sgg_total;

  const tier = toTier(activeRank, activeTotal);
  const config = tier ? tierConfig[tier] : null;

  // 절약점수 (활성 기준)
  const score = rankScore(activeRank, activeTotal);
  const scoreLabel = `절약점수 ${score}점`;

  // 부제 (어떤 기준인지 명시)
  const subtitle = useUmd
    ? `서울시 ${result.sgg_nm} ${result.umd_nm ?? ''} 기준`
    : `서울시 ${result.sgg_nm} 기준`;

  // 동 기준 percent (A/B: 상위, D/E: 하위)
  const isGood = tier === 'A' || tier === 'B' || tier === 'C';
  const umdPercent = activeTotal && activeRank
    ? isGood
      ? Math.round((activeRank / activeTotal) * 100)
      : Math.round(((activeTotal - activeRank) / activeTotal) * 100) + 1
    : null;

  // 구 기준 percent (fallback 텍스트용)
  const sggRank  = result.sgg_rank  ?? 0;
  const sggTotal = result.sgg_total ?? 0;
  const sggPercent = sggTotal > 0
    ? isGood
      ? Math.round((sggRank / sggTotal) * 100)
      : Math.round(((sggTotal - sggRank) / sggTotal) * 100) + 1
    : null;

  // 동/구 기준에 따라 템플릿 선택
  const titleTemplate = useUmd ? config?.title         : config?.fallbackTitle;
  const descTemplate  = useUmd ? config?.desc          : config?.fallbackDesc;

  const templateVars = {
    apt_nm:      result.apt_nm,
    sgg_nm:      result.sgg_nm,
    umd_nm:      result.umd_nm ?? result.sgg_nm,
    umd_rank:    activeRank  ?? 0,
    umd_total:   activeTotal ?? 0,
    umd_percent: umdPercent  ?? 0,
    rank:        sggRank,
    total_count: sggTotal,
    percent:     sggPercent  ?? 0,
  };

  const title = titleTemplate
    ? interpolate(titleTemplate, templateVars)
    : result.apt_nm;

  const desc = descTemplate
    ? interpolate(descTemplate, templateVars)
    : null;

  // 개인관리비 = 총 관리비 - 공동관리비
  const personalFee = (result.total_per_hh != null && result.common_per_hh != null)
    ? result.total_per_hh - result.common_per_hh
    : null;

  // 비교 기준 평균 (동 기준 우선, fallback 구 기준)
  const activeAvgTotal   = useUmd ? result.umd_avg_total   : result.sgg_avg_total;
  const activeAvgCommon  = useUmd ? result.umd_avg_common  : result.sgg_avg_common;
  const activeAvgPersonal = (activeAvgTotal != null && activeAvgCommon != null)
    ? activeAvgTotal - activeAvgCommon
    : null;
  const avgLabel = useUmd ? '동 평균' : '구 평균';

  return (
    <div className="space-y-8 py-2">

      {/* 상단 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700">
        <p className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
          관리비 분석 결과
        </p>
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 break-words">
          {result.sgg_nm} {result.umd_nm} {result.apt_nm}
        </p>
      </div>

      {/* 메인 결과 */}
      <div className="text-center space-y-4">
        <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${config?.color ?? 'text-gray-800 dark:text-gray-100'}`}>
          {scoreLabel}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {subtitle}
        </p>
        <h3 className={`text-lg sm:text-xl font-bold leading-snug break-words ${config?.color ?? 'text-gray-800 dark:text-gray-100'}`}>
          {title}
        </h3>
        {desc && (
          <div className="space-y-2 text-center">
            {desc.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 바 차트 (동→구→서울) */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-5 py-6 space-y-4">
        <BarRow
          label="동네 절약점수"
          dotColor="bg-cyan-400"
          score={rankScore(result.umd_rank, result.umd_total)}
        />
        <BarRow
          label="구 절약점수"
          dotColor="bg-violet-400"
          score={rankScore(result.sgg_rank, result.sgg_total)}
        />
        <BarRow
          label="서울 절약점수"
          dotColor="bg-blue-400"
          score={rankScore(result.seoul_rank, result.seoul_total)}
        />
      </div>

      {/* 주요 항목 비교 */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-5 py-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          주요 항목 비교
        </p>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-2 border-b border-gray-200 dark:border-gray-700 mb-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">항목</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 text-right">우리 단지</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 text-right">{avgLabel}</span>
        </div>
        <CompareRow label="총 관리비" amount={result.total_per_hh} sggAvg={activeAvgTotal} />
        <CompareRow label="공동관리비" amount={result.common_per_hh} sggAvg={activeAvgCommon} />
        <CompareRow label="개인관리비" amount={personalFee} sggAvg={activeAvgPersonal} />
      </div>

      {/* 공유 버튼 */}
      <AptMgmtShareButtons />

    </div>
  );
}
