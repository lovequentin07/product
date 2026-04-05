'use client';
// src/apt-mgmt/components/AptMgmtHistoryChart.tsx

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
import { MgmtFeeHistory } from '@apt-mgmt/types/management-fee';

interface Props {
  history: MgmtFeeHistory[];
}

function formatYm(ym: string): string {
  if (!ym || ym.length < 6) return ym;
  return `${ym.slice(2, 4)}.${ym.slice(4, 6)}`;
}

interface TooltipPayload {
  name: string;
  value: number | null;
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
    <div
      className="rounded-xl px-3 py-2.5 shadow-lg text-xs space-y-1"
      style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)' }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--ds-ink-muted)' }}>{label}</p>
      {payload.map((p) =>
        p.value != null ? (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value.toLocaleString()}원
          </p>
        ) : null
      )}
    </div>
  );
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
    <div
      className="rounded-2xl px-5 py-5"
      style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)' }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: 'var(--ds-ink-faint)' }}
      >
        관리비 추이 (최근 12개월)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e3dc" vertical={false} />
          <XAxis
            dataKey="ym"
            tick={{ fontSize: 11, fill: '#9a9085' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            tick={{ fontSize: 11, fill: '#9a9085' }}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#4a4540' }}
          />
          <Line
            type="monotone"
            dataKey="공용관리비"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
          <Line
            type="monotone"
            dataKey="총관리비"
            stroke="#047857"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#047857' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs mt-2 text-right" style={{ color: 'var(--ds-ink-faint)' }}>
        단위: 세대당 월 평균
      </p>
    </div>
  );
}
