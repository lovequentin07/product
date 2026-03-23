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
import { MonthlyPoint, TrendMeta } from '@market/types/market'

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
  const validHighs = allHighs.filter((v): v is number => v != null)
  const validLows = allLows.filter((v): v is number => v != null)
  const validAvgs = allAvgs.filter((v): v is number => v != null)
  const dataMax = validHighs.length > 0 ? Math.max(...validHighs) : (validAvgs.length > 0 ? Math.max(...validAvgs) : 0)
  const dataMin = validLows.length > 0 ? Math.min(...validLows) : (validAvgs.length > 0 ? Math.min(...validAvgs) : 0)

  const pad = (dataMax - dataMin) * 0.25 || dataMax * 0.15
  const domainMin = Math.max(0, dataMin - pad)
  const domainMax = dataMax + pad

  // lastYmRaw: monthly24의 마지막 달
  const lastYmRaw = monthly24.length > 0 ? monthly24[monthly24.length - 1].ym : null

  // 데이터에 high/low/currentDot 추가
  const chartData: { date: string; mAvg: number | null; high: number | null; low: number | null; currentDot: number | null }[] = []
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
      const isLastSlot = y === endY && m === endM
      chartData.push({
        date: ym,
        mAvg: monthData?.avg ?? null,
        high: monthData?.high ?? null,
        low: monthData?.low ?? null,
        currentDot: isLastSlot ? (currentPrice ?? null) : null,
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
              const prev = chartData[index - 1]?.mAvg
              const next = chartData[index + 1]?.mAvg
              const isolated = (prev == null || prev === undefined) && (next == null || next === undefined)
              return <circle key={index} cx={cx} cy={cy} r={isolated ? 4 : 2} fill="#6366f1" />
            }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            legendType="none"
          />

          {/* 오늘 마커 (currentDot만, 라인 없음) */}
          <Line
            type="linear"
            dataKey="currentDot"
            stroke="none"
            dot={(props: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
              const { cx = 0, cy = 0, index = 0, value } = props
              if (value == null) return <g key={index} />
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
                    {value.toLocaleString()}원
                  </text>
                </g>
              )
            }}
            activeDot={false}
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

      {/* 범례 테이블 - 폴센트 스타일 */}
      <div className="mt-5 mb-3 px-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-price-high)' }}>▲</span>
            <span className="text-gray-700">역대최고가</span>
          </div>
          <span style={{ color: 'var(--color-price-high)' }} className="font-medium">{trendMeta?.yearMax.toLocaleString()}원</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-price-current)' }}>—</span>
            <span className="text-gray-900 font-medium">현재가</span>
          </div>
          <span style={{ color: 'var(--color-price-current)' }} className="font-bold">{currentPrice?.toLocaleString()}원</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-price-low)' }}>▼</span>
            <span className="text-gray-700">역대최저가</span>
          </div>
          <span style={{ color: 'var(--color-price-low)' }} className="font-medium">{trendMeta?.yearMin.toLocaleString()}원</span>
        </div>
      </div>


    </div>
  )
}
