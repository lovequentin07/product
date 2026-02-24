// src/components/apt-mgmt/AptMgmtSummaryCards.tsx
// 헤더 + 상/중/하 Verdict Card

import { MgmtFeeResult } from '@/types/management-fee';
import { type Verdict, resultSummaryConfig } from './summaryConfig';

interface Props {
  result: MgmtFeeResult;
}

function formatWon(val: number | null | undefined): string {
  if (val == null) return '-';
  return `${val.toLocaleString()}원`;
}

function pctVsAvg(mine: number | null, avg: number | null): string | null {
  if (!mine || !avg) return null;
  const diff = ((mine - avg) / avg) * 100;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

// 상 = 점수 높음(절약), 하 = 점수 낮음(비쌈)
function getVerdict(rank: number | null, total: number | null): Verdict | null {
  if (!rank || !total) return null;
  const pct = (rank / total) * 100;
  if (pct <= 33) return '상';
  if (pct <= 66) return '중';
  return '하';
}

// desc 템플릿의 {변수} 치환
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

// 상 = 초록, 중 = 노랑, 하 = 빨강
const VERDICT_STYLE: Record<Verdict, { bg: string; border: string; text: string; badge: string }> = {
  상: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800 border border-green-300',
  },
  중: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  },
  하: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border border-red-300',
  },
};

export default function AptMgmtSummaryCards({ result }: Props) {
  const verdict = getVerdict(result.sgg_rank, result.sgg_total);
  const commonPct = pctVsAvg(result.common_per_hh, result.sgg_avg_common);
  const style = verdict ? VERDICT_STYLE[verdict] : null;
  const textConfig = verdict ? resultSummaryConfig.score.options[verdict] : null;

  // 템플릿 변수 계산
  const rank = result.sgg_rank ?? 0;
  const total = result.sgg_total ?? 0;
  const score = total > 0 ? Math.round((1 - rank / total) * 100) : null;
  // 상/중: 상위 X%, 하: 하위 X%
  const percent =
    total > 0
      ? verdict === '하'
        ? Math.round(((total - rank) / total) * 100) + 1
        : Math.round((rank / total) * 100)
      : null;

  const desc =
    textConfig && score !== null && percent !== null
      ? interpolate(textConfig.desc, {
          score,
          sgg_nm: result.sgg_nm,
          total_count: total.toLocaleString(),
          rank: rank.toLocaleString(),
          percent,
        })
      : textConfig?.desc ?? null;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <p className="text-sm text-blue-100 mb-1">
          {result.billing_ym.slice(0, 4)}년 {parseInt(result.billing_ym.slice(4, 6), 10)}월 기준
        </p>
        <h2 className="text-xl font-bold">{result.apt_nm}</h2>
        <p className="text-blue-100 text-sm">{result.sgg_nm} {result.umd_nm}</p>
        {result.household_cnt && (
          <p className="text-blue-200 text-xs mt-1">총 {result.household_cnt.toLocaleString()}세대</p>
        )}
      </div>

      {/* Verdict Card */}
      {style && textConfig && verdict ? (
        <div className={`rounded-xl border ${style.border} ${style.bg} p-5`}>
          <p className="text-sm font-medium text-gray-600 mb-3">관리비 수준</p>
          <div className="flex items-center gap-3 mb-3">
            {score !== null && (
              <span className={`text-2xl font-bold px-4 py-1.5 rounded-full ${style.badge}`}>
                {score}점
              </span>
            )}
            <span className={`text-base font-semibold ${style.text}`}>{textConfig.label}</span>
          </div>
          {desc && <p className="text-sm text-gray-700 mb-2">{desc}</p>}
          {result.common_per_hh && (
            <div className="text-sm text-gray-600 mt-2">
              세대당 월 공용관리비{' '}
              <strong className="text-gray-800">{formatWon(result.common_per_hh)}</strong>
              {commonPct && (
                <span className={parseFloat(commonPct) > 0 ? 'text-red-600' : 'text-green-600'}>
                  {' '}({result.sgg_nm} 평균 대비 {commonPct})
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 랭킹 데이터 없을 때 기본 수치 표시 */
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-2">세대당 월 공용관리비</p>
          <p className="text-2xl font-bold text-gray-900">{formatWon(result.common_per_hh)}</p>
          {commonPct && (
            <p className="text-sm text-gray-500 mt-1">
              {result.sgg_nm} 평균 대비{' '}
              <span className={parseFloat(commonPct) > 0 ? 'text-red-600' : 'text-green-600'}>
                {commonPct}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
