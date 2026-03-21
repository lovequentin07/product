'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MonthlyPoint, TrendMeta } from '@/types/market'

interface Props {
  monthly: MonthlyPoint[]  // 최대 24개월
  unit: string
  currentPrice?: number
  trendMeta?: TrendMeta
  cheapnessExplanation?: string
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
  const avg = payload.find((p) => p.dataKey === 'mAvg')
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg text-xs space-y-0.5">
      <p className="text-gray-400 mb-1">{label ? `${label.slice(2, 4)}.${label.slice(5, 7)}` : ''}</p>
      {avg && <p style={{ color: '#6366f1' }}>평균 {avg.value.toLocaleString()}원</p>}
    </div>
  )
}

export default function PriceTrendChart({ monthly, unit, currentPrice, trendMeta, cheapnessExplanation }: Props) {
  const monthly24 = monthly.slice(-24)

  const allAvgs = monthly24.map((m) => m.avg)
  const allHighs = monthly24.map((m) => m.high)
  const allLows = monthly24.map((m) => m.low)
  const dataMax = Math.max(...allHighs)   // 차트 최고가(빨간) 라인의 최대
  const dataMin = Math.min(...allLows)    // 차트 최저가(초록) 라인의 최소
  // 이번달(또는 지난달) 평균가
  const dataAvg = monthly24.length > 0 ? monthly24[monthly24.length - 1].avg : 0

  const pad = (dataMax - dataMin) * 0.25 || dataMax * 0.15
  const domainMin = Math.max(0, dataMin - pad)
  const domainMax = dataMax + pad

  // lastYmRaw: monthly24의 마지막 달
  const lastYmRaw = monthly24.length > 0 ? monthly24[monthly24.length - 1].ym : null

  // 데이터에 high/low 추가
  const chartData: { date: string; mAvg: number | null; high: number | null; low: number | null }[] = []
  if (lastYmRaw) {
    let fy = parseInt(lastYmRaw.slice(0, 4))
    let fm = parseInt(lastYmRaw.slice(4, 6)) - 23
    while (fm <= 0) { fm += 12; fy-- }
    const endY = parseInt(lastYmRaw.slice(0, 4))
    const endM = parseInt(lastYmRaw.slice(4, 6))
    let y = fy, m = fm
    while (y < endY || (y === endY && m <= endM)) {
      const ym = `${y}-${String(m).padStart(2, '0')}`
      const monthData = monthly24.find((md) => md.ym === `${y}${String(m).padStart(2, '0')}`)
      chartData.push({
        date: ym,
        mAvg: monthData?.avg ?? null,
        high: monthData?.high ?? null,
        low: monthData?.low ?? null,
      })
      m++
      if (m > 12) { m = 1; y++ }
    }
  }

  // X축: 6개월 간격 틱 (24.03, 24.09, 25.03, 25.09, 26.03 형식)
  const tickSet = new Set<string>()
  for (const d of chartData) {
    const mm = d.date.slice(5, 7)
    if (mm === '03' || mm === '09') tickSet.add(d.date)
  }
  // 마지막 포인트는 항상 포함
  if (chartData.length > 0) tickSet.add(chartData[chartData.length - 1].date)
  const monthTicks = [...tickSet].sort()

  return (
    <div className="mx-4 bg-white overflow-hidden">
      <h3 className="text-base font-bold text-gray-800 pt-4 pb-3">
        가격 추이
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 16, right: 60, left: 16, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <YAxis hide domain={[domainMin, domainMax]} />
          <XAxis
            dataKey="date"
            ticks={monthTicks}
            interval={0}
            tickFormatter={(v: string) => {
              const yy = v.slice(2, 4)
              const mm = v.slice(5, 7)
              return `${yy}.${mm}`
            }}
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
            tickMargin={8}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />


          {/* 월별 평균가 라인 */}
          <Line
            type="linear"
            dataKey="mAvg"
            stroke="#6366f1"
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
              const { cx = 0, cy = 0, index = 0, value } = props
              if (value == null) return <g key={index} />
              const isLast = index === chartData.length - 1
              const prev = chartData[index - 1]?.mAvg
              const next = chartData[index + 1]?.mAvg
              const isolated = (prev == null || prev === undefined) && (next == null || next === undefined)

              // 마지막 포인트: 크게 + 라벨 (2줄)
              if (isLast && currentPrice != null) {
                const labelY = cy > 50 ? cy - 20 : cy + 20
                return (
                  <g key={index}>
                    <circle cx={cx} cy={cy} r={6} fill="#2563eb" />
                    <text
                      x={cx + 8}
                      y={labelY}
                      textAnchor="start"
                      fill="#2563eb"
                      fontSize={9}
                      fontWeight={600}
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
                    >
                      오늘
                    </text>
                    <text
                      x={cx + 8}
                      y={labelY + 10}
                      textAnchor="start"
                      fill="#2563eb"
                      fontSize={9}
                      fontWeight={600}
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif"
                    >
                      {currentPrice.toLocaleString()}원
                    </text>
                  </g>
                )
              }

              return <circle key={index} cx={cx} cy={cy} r={isolated ? 4 : 2} fill="#6366f1" />
            }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            legendType="none"
          />

          {/* 월별 최고가 라인 */}
          <Line
            type="linear"
            dataKey="high"
            stroke="#fca5a5"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            legendType="none"
          />

          {/* 월별 최저가 라인 */}
          <Line
            type="linear"
            dataKey="low"
            stroke="#86efac"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 테이블 */}
      <div className="mt-3 mb-2 px-1">
        <div className="grid grid-cols-[1.5rem_1fr_auto] gap-2 items-center py-1">
          <span style={{ color: '#f87171' }} className="text-center">▲</span>
          <span className="text-sm font-medium text-gray-700">월별최고가</span>
          <span className="text-sm font-medium text-gray-900 text-right">{dataMax.toLocaleString()}원</span>
        </div>
        <div className="grid grid-cols-[1.5rem_1fr_auto] gap-2 items-center py-1">
          <span style={{ color: '#2563eb' }} className="text-center">●</span>
          <span className="text-sm font-medium text-gray-700">오늘 가격</span>
          <span className="text-sm font-medium text-gray-900 text-right">{currentPrice?.toLocaleString()}원</span>
        </div>
        <div className="grid grid-cols-[1.5rem_1fr_auto] gap-2 items-center py-1">
          <span style={{ color: '#6366f1' }} className="text-center">—</span>
          <span className="text-sm font-medium text-gray-700">월별평균가</span>
          <span className="text-sm font-medium text-gray-900 text-right">{dataAvg.toLocaleString()}원</span>
        </div>
        <div className="grid grid-cols-[1.5rem_1fr_auto] gap-2 items-center py-1">
          <span style={{ color: '#4ade80' }} className="text-center">▼</span>
          <span className="text-sm font-medium text-gray-700">월별최저가</span>
          <span className="text-sm font-medium text-gray-900 text-right">{dataMin.toLocaleString()}원</span>
        </div>
      </div>

      {/* 가격 분석 설명 */}
      {cheapnessExplanation && (
        <div className="mt-4 mx-4 mb-4 px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-800 leading-relaxed">
            {cheapnessExplanation}
          </p>
        </div>
      )}

    </div>
  )
}
