// src/components/apt-mgmt/AptMgmtReportCards.tsx
// 3가지 리포트 카드: 공용관리비 / 경비·청소비 / 장기수선충당금

import { MgmtFeeResult } from '@/types/management-fee';

interface Props {
  result: MgmtFeeResult;
}

type Level = '상' | '중' | '하';

const LEVEL_STYLE: Record<Level, string> = {
  하: 'bg-green-100 text-green-800 border border-green-200',
  중: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  상: 'bg-red-100 text-red-800 border border-red-200',
};

function formatWon(val: number | null | undefined): string {
  if (val == null) return '-';
  return `${Math.round(val).toLocaleString()}원`;
}

function pctDiff(mine: number | null | undefined, avg: number | null | undefined): { pct: number; str: string } | null {
  if (!mine || !avg) return null;
  const pct = ((mine - avg) / avg) * 100;
  return { pct, str: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` };
}

function commonLevel(mine: number | null, avg: number | null): Level {
  const diff = pctDiff(mine, avg);
  if (!diff) return '중';
  if (diff.pct > 10) return '상';
  if (diff.pct < -10) return '하';
  return '중';
}

function absoluteLevel(perHh: number | null, lowThreshold: number, highThreshold: number): Level {
  if (perHh == null) return '중';
  if (perHh < lowThreshold) return '하';
  if (perHh > highThreshold) return '상';
  return '중';
}

interface CardProps {
  icon: string;
  title: string;
  level: Level;
  mainValue: string;
  description: string;
  subNote?: string;
}

function ReportCard({ icon, title, level, mainValue, description, subNote }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_STYLE[level]}`}>
          {level}
        </span>
      </div>
      <p className="text-xl font-bold text-gray-900">{mainValue}</p>
      <p className="text-xs text-gray-500">{description}</p>
      {subNote && <p className="text-xs text-gray-400">{subNote}</p>}
    </div>
  );
}

export default function AptMgmtReportCards({ result }: Props) {
  // 카드 1: 공용관리비
  const commonDiff = pctDiff(result.common_per_hh, result.sgg_avg_common);
  const card1Level = commonLevel(result.common_per_hh, result.sgg_avg_common);
  const card1Desc = commonDiff
    ? `${result.sgg_nm} 평균 대비 ${commonDiff.str}`
    : '구 평균 비교 데이터 없음';

  // 카드 2: 경비·청소비 (세대당 합산)
  const secCleanPerHh =
    result.security_per_hh != null && result.cleaning_per_hh != null
      ? result.security_per_hh + result.cleaning_per_hh
      : result.security_per_hh ?? result.cleaning_per_hh ?? null;
  // 서울 기준 경비·청소비 세대당 ~5,000~20,000원 구간
  const card2Level = absoluteLevel(secCleanPerHh, 5000, 20000);
  const card2Desc = secCleanPerHh != null ? `월 세대당 ${formatWon(secCleanPerHh)}` : '데이터 없음';
  const card2Sub =
    result.security_per_hh != null && result.cleaning_per_hh != null
      ? `경비 ${formatWon(result.security_per_hh)} + 청소 ${formatWon(result.cleaning_per_hh)}`
      : undefined;

  // 카드 3: 장기수선충당금
  // 서울 기준 세대당 ~3,000~15,000원 구간
  const card3Level = absoluteLevel(result.ltm_per_hh, 3000, 15000);
  const card3Desc = result.ltm_per_hh != null ? `월 세대당 ${formatWon(result.ltm_per_hh)} 적립` : '데이터 없음';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ReportCard
        icon="🏠"
        title="공용관리비"
        level={card1Level}
        mainValue={formatWon(result.common_per_hh)}
        description={card1Desc}
        subNote={result.sgg_avg_common ? `${result.sgg_nm} 평균: ${formatWon(Math.round(result.sgg_avg_common))}` : undefined}
      />
      <ReportCard
        icon="🧹"
        title="경비·청소비"
        level={card2Level}
        mainValue={formatWon(secCleanPerHh)}
        description={card2Desc}
        subNote={card2Sub}
      />
      <ReportCard
        icon="🔧"
        title="장기수선충당금"
        level={card3Level}
        mainValue={formatWon(result.ltm_per_hh)}
        description={card3Desc}
        subNote={result.ltm_reserve_rate ? `적립률 ${result.ltm_reserve_rate.toFixed(1)}%` : undefined}
      />
    </div>
  );
}
