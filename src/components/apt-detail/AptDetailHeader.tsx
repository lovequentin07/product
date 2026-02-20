import React from 'react';
import Link from 'next/link';
import { AptHistoryResult } from '@/lib/db/types';

interface Props {
  data: AptHistoryResult;
  backHref: string;
}

function toBillion(manwon: number) {
  return (manwon / 10000).toFixed(1);
}

const AptDetailHeader: React.FC<Props> = ({ data, backHref }) => {
  const latestPrice = data.recentTransactions[0]?.deal_amount ?? 0;
  const avgPrice =
    data.totalCount > 0
      ? Math.round(
          data.monthly.reduce((s, m) => s + m.avgPrice * m.count, 0) /
            data.monthly.reduce((s, m) => s + m.count, 0)
        )
      : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
      {/* 뒤로가기 */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3"
      >
        ← 목록으로 돌아가기
      </Link>

      {/* 아파트 정보 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.aptName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.sggNm} · {data.umdNm} · 건축 {data.buildYear}년
          </p>
        </div>

        {/* 요약 통계 */}
        <div className="flex flex-wrap gap-4">
          <Stat label="총 거래" value={`${data.totalCount}건`} />
          <Stat
            label="최근 거래"
            value={latestPrice ? `${toBillion(latestPrice)}억` : '-'}
            color="text-blue-600 dark:text-blue-400"
          />
          <Stat
            label="전체 평균"
            value={avgPrice ? `${toBillion(avgPrice)}억` : '-'}
            color="text-red-600 dark:text-red-400"
          />
        </div>
      </div>
    </div>
  );
};

function Stat({ label, value, color = 'text-gray-800 dark:text-gray-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default AptDetailHeader;
