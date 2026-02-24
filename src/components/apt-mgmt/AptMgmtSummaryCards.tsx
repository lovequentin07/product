// src/components/apt-mgmt/AptMgmtSummaryCards.tsx
// 헤더 + 상/중/하 Verdict Card

import { MgmtFeeResult } from '@/types/management-fee';

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

type Verdict = '상' | '중' | '하';

function getVerdict(rank: number | null, total: number | null): Verdict | null {
  if (!rank || !total) return null;
  const pct = (rank / total) * 100;
  if (pct <= 33) return '하';
  if (pct <= 66) return '중';
  return '상';
}

const VERDICT_CONFIG: Record<Verdict, { bg: string; border: string; text: string; badge: string; label: string; desc: string }> = {
  하: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800 border border-green-300',
    label: '하 (절약형)',
    desc: '서울 평균 대비 관리비가 낮은 편입니다.',
  },
  중: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    label: '중 (보통)',
    desc: '서울 평균 수준의 관리비입니다.',
  },
  상: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border border-red-300',
    label: '상 (주의)',
    desc: '서울 평균 대비 관리비가 높은 편입니다.',
  },
};

export default function AptMgmtSummaryCards({ result }: Props) {
  const verdict = getVerdict(result.seoul_rank, result.seoul_total);
  const commonPct = pctVsAvg(result.common_per_hh, result.sgg_avg_common);
  const cfg = verdict ? VERDICT_CONFIG[verdict] : null;

  const seoulPct =
    result.seoul_rank && result.seoul_total
      ? Math.round((result.seoul_rank / result.seoul_total) * 100)
      : null;

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
      {cfg && verdict ? (
        <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
          <p className="text-sm font-medium text-gray-600 mb-3">관리비 수준</p>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-2xl font-bold px-4 py-1.5 rounded-full ${cfg.badge}`}>
              {verdict}
            </span>
            <span className={`text-base font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{cfg.desc}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {seoulPct !== null && (
              <span>서울 {result.seoul_total?.toLocaleString()}개 단지 중 상위 {seoulPct}%</span>
            )}
            {result.common_per_hh && (
              <span>
                세대당 월 공용관리비{' '}
                <strong className="text-gray-800">{formatWon(result.common_per_hh)}</strong>
                {commonPct && (
                  <span className={parseFloat(commonPct) > 0 ? 'text-red-600' : 'text-green-600'}>
                    {' '}({result.sgg_nm} 평균 대비 {commonPct})
                  </span>
                )}
              </span>
            )}
          </div>
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
