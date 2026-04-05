'use client';
// src/apt-mgmt/components/AptMgmtHistoryChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MgmtFeeHistory } from '@apt-mgmt/types/management-fee';

interface Props {
  history: MgmtFeeHistory[];
}

function formatYm(ym: string): string {
  if (!ym || ym.length < 6) return ym;
  return `${ym.slice(2, 4)}.${ym.slice(4, 6)}`;
}

function formatWon(val: number): string {
  return `${Math.round(val / 1000)}k`;
}

export default function AptMgmtHistoryChart({ history }: Props) {
  if (!history || history.length === 0) return null;

  const data = [...history]
    .sort((a, b) => a.billing_ym.localeCompare(b.billing_ym))
    .slice(-12)
    .map(h => ({
      ym: formatYm(h.billing_ym),
      공용관리비: h.common_per_hh ?? null,
      총관리비: h.total_per_hh ?? null,
    }));

  return (
    <div className="bg-gray-50 rounded-2xl px-5 py-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
        관리비 추이 (최근 12개월)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="ym" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tickFormatter={formatWon} tick={{ fontSize: 11, fill: '#9ca3af' }} width={36} />
          <Tooltip
            formatter={(val: number | string | undefined) => [val != null && typeof val === 'number' ? `${val.toLocaleString()}원` : String(val ?? ''), '']}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="공용관리비" stroke="#6366f1" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="총관리비" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2 text-right">단위: 세대당 월 평균</p>
    </div>
  );
}
