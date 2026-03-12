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
    <text x={x + width} y={y - 4} textAnchor="end" fontSize={12} fontWeight={700} fill="#f87171">
      1년최고가 {value.toLocaleString()}원
    </text>
  )
}

function MinLabel({ viewBox, value }: { viewBox?: { x?: number; y?: number; width?: number }; value: number }) {
  const { x = 0, y = 0, width = 0 } = viewBox ?? {}
  return (
    <text x={x + width} y={y + 14} textAnchor="end" fontSize={12} fontWeight={700} fill="#4ade80">
      1년최저가 {value.toLocaleString()}원
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
      <p className="text-gray-400 mb-1">{label ? `${parseInt(label.slice(5, 7))}월` : ''}</p>
      {hi && <p style={{ color: '#f87171' }}>월 최고 {hi.value.toLocaleString()}원</p>}
      {lo && <p style={{ color: '#4ade80' }}>월 최저 {lo.value.toLocaleString()}원</p>}
    </div>
  )
}

export default function PriceTrendChart2({ trend, unit, trendMeta }: Props) {
  const sliced = trend.slice(-365)

  // 실제 데이터 min/max/avg (trend의 retail 값 기준)
  const retailValues = sliced.map((p) => p.retail)
  const dataMin = Math.min(...retailValues)
  const dataMax = Math.max(...retailValues)
  const dataAvg = Math.round(retailValues.reduce((a, b) => a + b, 0) / retailValues.length)

  const pad = (dataMax - dataMin) * 0.25 || dataMax * 0.15
  const domainMin = Math.max(0, dataMin - pad)
  const domainMax = dataMax + pad

  // 월별 집계 (월당 1개 앵커 포인트)
  const monthGroups: Record<string, number[]> = {}
  for (const p of sliced) {
    const ym = p.date.slice(0, 7)
    if (!monthGroups[ym]) monthGroups[ym] = []
    monthGroups[ym].push(p.retail)
  }

  // 실제 데이터가 있는 월 → { ym → { mMax, mMin } }
  const anchorByYm: Record<string, { mMax: number; mMin: number }> = {}
  for (const [ym, prices] of Object.entries(monthGroups)) {
    anchorByYm[ym] = { mMax: Math.max(...prices), mMin: Math.min(...prices) }
  }

  // 전체 기간(firstYm~lastYm)의 모든 월을 순서대로 생성
  // 데이터 없는 월은 null → connectNulls={false} 로 라인 끊김
  const firstYm = sliced[0]?.date.slice(0, 7) ?? ''
  const lastYm  = sliced[sliced.length - 1]?.date.slice(0, 7) ?? ''
  const data: { date: string; mMax: number | null; mMin: number | null }[] = []

  if (firstYm && lastYm) {
    let [y, m] = firstYm.split('-').map(Number)
    const [endY, endM] = lastYm.split('-').map(Number)
    while (y < endY || (y === endY && m <= endM)) {
      const ym = `${y}-${String(m).padStart(2, '0')}`
      const anchor = anchorByYm[ym]
      data.push({
        date: ym,
        mMax: anchor?.mMax ?? null,
        mMin: anchor?.mMin ?? null,
      })
      m++
      if (m > 12) { m = 1; y++ }
    }
  }

  // X축: 첫·1/3·2/3·마지막 월 표시 (항상 마지막 라벨 포함)
  const n = data.length
  const tickIndices = [...new Set([0, Math.floor(n / 3), Math.floor(2 * n / 3), n - 1])]
  const monthTicks = tickIndices.map((i) => data[i].date)

  return (
    <div className="mx-4 bg-white overflow-hidden">
      <h3 className="text-base font-bold text-gray-800 pt-4 pb-3">
        1년 가격 그래프
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <YAxis hide domain={[domainMin, domainMax]} />
          <XAxis
            dataKey="date"
            ticks={monthTicks}
            interval={0}
            tickFormatter={(v: string) => {
              const mm = v.length >= 7 ? v.slice(5, 7) : v.slice(0, 2)
              const n = parseInt(mm, 10)
              return isNaN(n) ? '' : `${n}월`
            }}
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
            tickMargin={8}
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

          {/* 월별 최고가 라인 */}
          <Line
            type="linear"
            dataKey="mMax"
            stroke="#f87171"
            strokeWidth={1.5}
            dot={(props: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
              const { cx = 0, cy = 0, index = 0, value } = props
              if (value == null) return <g key={index} />
              const prev = data[index - 1]?.mMax
              const next = data[index + 1]?.mMax
              const isolated = (prev == null || prev === undefined) && (next == null || next === undefined)
              return <circle key={index} cx={cx} cy={cy} r={isolated ? 4 : 2} fill="#f87171" />
            }}
            activeDot={false}
            connectNulls={false}
            legendType="none"
          />

          {/* 월별 최저가 라인 */}
          <Line
            type="linear"
            dataKey="mMin"
            stroke="#4ade80"
            strokeWidth={1.5}
            dot={(props: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
              const { cx = 0, cy = 0, index = 0, value } = props
              if (value == null) return <g key={index} />
              const prev = data[index - 1]?.mMin
              const next = data[index + 1]?.mMin
              const isolated = (prev == null || prev === undefined) && (next == null || next === undefined)
              return <circle key={index} cx={cx} cy={cy} r={isolated ? 4 : 2} fill="#4ade80" />
            }}
            activeDot={false}
            connectNulls={false}
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 테이블 (폴센트 스타일) */}
      <div className="mt-3 mb-2 px-1">
        <div className="flex items-center justify-between py-3">
          <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
            <span style={{ color: '#f87171' }}>▲</span> 1년최고가
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#f87171' }}>
            {dataMax.toLocaleString()}원
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="text-gray-400">—</span> 평균가
          </span>
          <span className="text-[16px] font-bold text-gray-700">{dataAvg.toLocaleString()}원</span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
            <span style={{ color: '#4ade80' }}>▼</span> 1년최저가
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#4ade80' }}>
            {dataMin.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  )
}
