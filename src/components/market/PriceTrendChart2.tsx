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

function MaxLabel({ viewBox, value }: { viewBox?: { x?: number; y?: number; width?: number }; value: number }) {
  const { x = 0, y = 0, width = 0 } = viewBox ?? {}
  return (
    <text x={x + width} y={y - 4} textAnchor="end" fontSize={12} fill="#f87171">
      역대최고가 {value.toLocaleString()}원
    </text>
  )
}

function MinLabel({ viewBox, value }: { viewBox?: { x?: number; y?: number; width?: number }; value: number }) {
  const { x = 0, y = 0, width = 0 } = viewBox ?? {}
  return (
    <text x={x + width} y={y + 14} textAnchor="end" fontSize={12} fill="#4ade80">
      역대최저가 {value.toLocaleString()}원
    </text>
  )
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
  const hi = payload.find((p) => p.dataKey === 'mMax')
  const lo = payload.find((p) => p.dataKey === 'mMin')
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg text-xs space-y-0.5">
      <p className="text-gray-400 mb-1">{label}</p>
      {hi && <p style={{ color: '#f87171' }}>월 최고 {hi.value.toLocaleString()}원</p>}
      {lo && <p style={{ color: '#4ade80' }}>월 최저 {lo.value.toLocaleString()}원</p>}
    </div>
  )
}

export default function PriceTrendChart2({ trend, unit, trendMeta }: Props) {
  const sliced = trend.slice(-365)

  // 실제 데이터 min/max (trendMeta.yearMax는 극단값일 수 있으므로 데이터 기준)
  const retailValues = sliced.map((p) => p.retail)
  const dataMin = Math.min(...retailValues)
  const dataMax = Math.max(...retailValues)
  const dataAvg = Math.round(retailValues.reduce((a, b) => a + b, 0) / retailValues.length)

  // 레이블이 선 위/아래에 들어갈 공간 확보
  const pad = (dataMax - dataMin) * 0.25 || dataMax * 0.15
  const domainMin = Math.max(0, dataMin - pad)
  const domainMax = dataMax + pad

  // 월별 집계: 각 월의 마지막 날에 max/min 앵커
  const monthGroups: Record<string, number[]> = {}
  for (const p of sliced) {
    const ym = p.date.slice(0, 7)
    if (!monthGroups[ym]) monthGroups[ym] = []
    monthGroups[ym].push(p.retail)
  }

  const monthlyAnchors: Record<string, { max: number; min: number }> = {}
  for (const [ym, prices] of Object.entries(monthGroups)) {
    const lastDate = sliced.filter((p) => p.date.startsWith(ym)).at(-1)?.date.slice(5) ?? ''
    if (lastDate) {
      monthlyAnchors[lastDate] = {
        max: Math.max(...prices),
        min: Math.min(...prices),
      }
    }
  }

  const data = sliced.map((p) => ({
    date: p.date.slice(5),
    mMax: monthlyAnchors[p.date.slice(5)]?.max ?? null,
    mMin: monthlyAnchors[p.date.slice(5)]?.min ?? null,
  }))

  // X축: 데이터 순서(시간순)로 앵커 날짜 수집 → 홀수 인덱스만 (3,5,7,9,11,1월)
  const anchorDates: string[] = []
  for (const d of data) {
    if (monthlyAnchors[d.date]) anchorDates.push(d.date)
  }
  const monthTicks = anchorDates.filter((_, i) => i % 2 === 0)

  return (
    <div className="mx-4 bg-white overflow-hidden">
      <h3 className="text-base font-bold text-gray-800 pt-4 pb-3">
        1년 가격 그래프
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <YAxis hide domain={[domainMin, domainMax]} />
          <XAxis
            dataKey="date"
            ticks={monthTicks}
            interval={0}
            tickFormatter={(v: string) => `${parseInt(v.slice(0, 2))}월`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* 역대최고가 점선 — 레이블 선 위 우측 (커스텀 위치) */}
          <ReferenceLine
            y={dataMax}
            stroke="#fca5a5"
            strokeDasharray="5 4"
            strokeWidth={1}
            label={<MaxLabel value={dataMax} />}
          />

          {/* 역대최저가 점선 — 레이블 선 아래 우측 (커스텀 위치) */}
          <ReferenceLine
            y={dataMin}
            stroke="#86efac"
            strokeDasharray="5 4"
            strokeWidth={1}
            label={<MinLabel value={dataMin} />}
          />

          {/* 월별 최고가 라인 (12포인트) */}
          <Line
            type="linear"
            dataKey="mMax"
            stroke="#f87171"
            strokeWidth={1.5}
            dot={{ r: 2, fill: '#f87171', strokeWidth: 0 }}
            activeDot={false}
            connectNulls
            legendType="none"
          />

          {/* 월별 최저가 라인 (12포인트) */}
          <Line
            type="linear"
            dataKey="mMin"
            stroke="#4ade80"
            strokeWidth={1.5}
            dot={{ r: 2, fill: '#4ade80', strokeWidth: 0 }}
            activeDot={false}
            connectNulls
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 테이블 (폴센트 스타일) */}
      <div className="mt-3 mb-2 px-1">
        <div className="flex items-center justify-between py-3">
          <span className="text-[14px] text-gray-500 flex items-center gap-1.5">
            <span style={{ color: '#f87171' }}>▲</span> 역대최고가
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#f87171' }}>
            {dataMax.toLocaleString()}원
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-[14px] text-gray-500 flex items-center gap-1.5">
            <span className="text-gray-400">—</span> 평균가
          </span>
          <span className="text-[16px] font-bold text-gray-700">{dataAvg.toLocaleString()}원</span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-[14px] text-gray-500 flex items-center gap-1.5">
            <span style={{ color: '#4ade80' }}>▼</span> 역대최저가
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#4ade80' }}>
            {dataMin.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  )
}
