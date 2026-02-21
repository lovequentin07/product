"use client";

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MonthlyStats, AreaStats } from '@/lib/db/types';

interface Props {
  monthly: MonthlyStats[];
  byArea: AreaStats[];
  sggCd: string;
  aptNm: string;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value.toFixed(1)}억</strong>
        </p>
      ))}
    </div>
  );
}

function toChartData(monthly: MonthlyStats[]) {
  return [...monthly].reverse().map((m) => ({
    yearMonth: m.yearMonth,
    평균거래가: parseFloat((m.avgPrice / 10000).toFixed(2)),
    평균평당가: parseFloat(m.avgPricePerPyeong.toFixed(2)),
    건수: m.count,
  }));
}

const PriceTrendChart: React.FC<Props> = ({ monthly, byArea, sggCd, aptNm }) => {
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const [displayData, setDisplayData] = useState(() => toChartData(monthly));
  const [loading, setLoading] = useState(false);

  const handleTabSelect = async (bucket: number | null) => {
    setSelectedBucket(bucket);
    if (bucket === null) {
      setDisplayData(toChartData(monthly));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/apt/${sggCd}/${encodeURIComponent(aptNm)}/history?area_bucket=${bucket}`
      );
      const json = await res.json() as { monthly?: MonthlyStats[] };
      setDisplayData(toChartData(json.monthly ?? []));
    } catch {
      // 실패 시 전체 데이터 유지
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
      {/* 헤더 + 평수 탭 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          월별 평균 거래가 추이
        </h2>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleTabSelect(null)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              selectedBucket === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            전체
          </button>
          {byArea.map((a) => (
            <button
              key={a.minPyeong}
              onClick={() => handleTabSelect(a.minPyeong)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedBucket === a.minPyeong
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={displayData} margin={{ top: 5, right: 55, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="yearMonth"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#2563eb' }}
              tickFormatter={(v: number) => `${v}억`}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#dc2626' }}
              tickFormatter={(v: number) => `${v}억`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="평균거래가"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="평균평당가"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceTrendChart;
