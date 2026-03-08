'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { PricePoint, TrendMeta } from '@/types/market'

interface Props {
  trend: PricePoint[]
  unit: string
  trendMeta: TrendMeta
}

interface TooltipPayload {
  dataKey: string
  value: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const rt = payload.find((p) => p.dataKey === 'retail')
  const ws = payload.find((p) => p.dataKey === 'wholesale')
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {rt && (
        <p className="font-bold text-gray-900">소매 {rt.value.toLocaleString()}원</p>
      )}
      {ws && (
        <p className="text-gray-400 mt-0.5">도매 {ws.value.toLocaleString()}원</p>
      )}
    </div>
  )
}

export default function PriceTrendChart({ trend, unit, trendMeta }: Props) {
  const data = trend.slice(-365).map((p) => ({
    date: p.date.slice(5),
    retail: p.retail,
    wholesale: p.wholesale,
  }))

  const today = trend[trend.length - 1]
  const todayWholesale = today?.wholesale ?? 0
  const todayRetail = today?.retail ?? 0
  const wholesaleMarginRate =
    todayWholesale > 0
      ? ((todayRetail - todayWholesale) / todayWholesale) * 100
      : null

  return (
    <div className="mx-4 mt-4 bg-white border-t border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          소매가 추이 (1년)
          <span className="text-xs font-normal text-gray-400 ml-1">({unit})</span>
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={trendMeta.yearAvg}
            stroke="#d1d5db"
            strokeDasharray="4 4"
            label={{ value: '연평균', position: 'right', fontSize: 9, fill: '#9ca3af' }}
          />
          <ReferenceLine
            x={data[data.length - 1]?.date}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: '오늘', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
          />
          <Line
            type="monotone"
            dataKey="retail"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={(props: { cx?: number; cy?: number; index?: number }) => {
              const { cx, cy, index } = props
              if (index !== data.length - 1) return <g key={`r-${index}`} />
              return (
                <circle
                  key={`r-${index}`}
                  cx={cx ?? 0}
                  cy={cy ?? 0}
                  r={5}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth={2}
                />
              )
            }}
            activeDot={{ r: 4, fill: '#ef4444' }}
          />
          <Line
            type="monotone"
            dataKey="wholesale"
            stroke="#94a3b8"
            strokeWidth={2.0}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 + 도매가 정보 */}
      <div className="px-4 pb-4">
        <div className="flex gap-4 text-xs text-gray-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-red-500 rounded" />
            소매가
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t border-dashed border-[#94a3b8]" />
            도매가
          </span>
        </div>
        {todayWholesale > 0 && (
          <p className="text-xs text-gray-400">
            오늘 도매가 {todayWholesale.toLocaleString()}원
            {wholesaleMarginRate != null && (
              <span className="ml-1 text-gray-500">· 유통마진 +{wholesaleMarginRate.toFixed(0)}%</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
