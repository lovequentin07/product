"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AreaStats } from '@/lib/db/types';

interface Props {
  byArea: AreaStats[];
}

const COLORS = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];

interface TooltipPayload {
  value: number;
  name: string;
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
  const avgBillion = (payload[0].value / 10000).toFixed(1);
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      <p className="text-blue-600">평균가: <strong>{avgBillion}억</strong></p>
    </div>
  );
}

const AreaBarChart: React.FC<Props> = ({ byArea }) => {
  const data = byArea.map((a) => ({
    label: a.label,
    평균거래가: a.avgPrice,
    건수: a.count,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
        면적대별 평균 거래가
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}억`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="평균거래가" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* 거래 건수 요약 */}
      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {byArea.map((a, i) => (
          <div key={a.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {a.label}: {a.count}건
          </div>
        ))}
      </div>
    </div>
  );
};

export default AreaBarChart;
