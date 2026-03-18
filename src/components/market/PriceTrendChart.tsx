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
import { MonthlyPoint, TrendMeta } from '@/types/market'

interface Props {
  monthly: MonthlyPoint[]  // 최대 24개월
  unit: string
  trendMeta: TrendMeta     // vsYearAvgRate = rolling avg %
  currentPrice?: number
  yoyPrice?: number
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

export default function PriceTrendChart({ monthly, unit, trendMeta, currentPrice, yoyPrice }: Props) {
  // displayRate: rolling avg 기준 (trendMeta.vsYearAvgRate)
  const displayRate = trendMeta.vsYearAvgRate

  const monthly24 = monthly.slice(-24)

  const allAvgs = monthly24.map((m) => m.avg)
  const dataMin = Math.min(...allAvgs)
  const dataMax = Math.max(...allAvgs)
  const dataAvg = Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length)

  const pad = (dataMax - dataMin) * 0.25 || dataMax * 0.15
  const domainMin = Math.max(0, dataMin - pad)
  const domainMax = dataMax + pad

  // anchorByYm: monthly24 데이터 인덱싱
  const anchorByYm: Record<string, { mAvg: number }> = {}
  for (const m of monthly24) {
    const ym = `${m.ym.slice(0, 4)}-${m.ym.slice(4, 6)}`
    anchorByYm[ym] = { mAvg: m.avg }
  }

  // 고정 24개월 구간: monthly24 마지막 달 기준 23개월 전 ~ 마지막 달
  const lastYmRaw = monthly24.length > 0 ? monthly24[monthly24.length - 1].ym : null
  const data: { date: string; mAvg: number | null }[] = []

  if (lastYmRaw) {
    let fy = parseInt(lastYmRaw.slice(0, 4))
    let fm = parseInt(lastYmRaw.slice(4, 6)) - 23
    while (fm <= 0) { fm += 12; fy-- }
    const endY = parseInt(lastYmRaw.slice(0, 4))
    const endM = parseInt(lastYmRaw.slice(4, 6))
    let y = fy, m = fm
    while (y < endY || (y === endY && m <= endM)) {
      const ym = `${y}-${String(m).padStart(2, '0')}`
      const anchor = anchorByYm[ym]
      data.push({ date: ym, mAvg: anchor?.mAvg ?? null })
      m++
      if (m > 12) { m = 1; y++ }
    }
  }

  // X축: 6개월 간격 틱 (24.03, 24.09, 25.03, 25.09, 26.03 형식)
  const tickSet = new Set<string>()
  for (const d of data) {
    const mm = d.date.slice(5, 7)
    if (mm === '03' || mm === '09') tickSet.add(d.date)
  }
  // 마지막 포인트는 항상 포함
  if (data.length > 0) tickSet.add(data[data.length - 1].date)
  const monthTicks = [...tickSet].sort()

  return (
    <div className="mx-4 bg-white overflow-hidden">
      <h3 className="text-base font-bold text-gray-800 pt-4 pb-3">
        가격 추이
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

          {/* 오늘 가격 기준선 */}
          {currentPrice != null && (
            <ReferenceLine
              y={currentPrice}
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: `오늘 ${currentPrice.toLocaleString()}원`,
                position: 'insideBottomRight',
                fontSize: 11,
                fontWeight: 700,
                fill: '#2563eb',
              }}
            />
          )}

          {/* 작년 이맘때 기준선 */}
          {yoyPrice != null && (
            <ReferenceLine
              y={yoyPrice}
              stroke="#f97316"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}

          {/* 월별 평균가 라인 */}
          <Line
            type="linear"
            dataKey="mAvg"
            stroke="#6366f1"
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; index?: number; value?: number | null }) => {
              const { cx = 0, cy = 0, index = 0, value } = props
              if (value == null) return <g key={index} />
              const prev = data[index - 1]?.mAvg
              const next = data[index + 1]?.mAvg
              const isolated = (prev == null || prev === undefined) && (next == null || next === undefined)
              return <circle key={index} cx={cx} cy={cy} r={isolated ? 4 : 2} fill="#6366f1" />
            }}
            activeDot={{ r: 4 }}
            connectNulls={false}
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 범례 테이블 */}
      <div className="mt-3 mb-2 px-1">
        {currentPrice != null && (
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: '#2563eb' }}>
              <span>—</span> 오늘 가격
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold" style={{ color: '#2563eb' }}>
                {currentPrice.toLocaleString()}원
              </span>
              {displayRate !== 0 && (
                <span
                  className="text-[12px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: displayRate < 0 ? '#2563eb' : '#ef4444',
                    background: displayRate < 0 ? '#eff6ff' : '#fef2f2',
                  }}
                >
                  {displayRate < 0 ? '▼' : '▲'} {Math.abs(displayRate).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        )}
        {yoyPrice != null && (
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
              <span style={{ color: '#f97316' }}>—</span> 작년 이맘때
            </span>
            <span className="text-[16px] font-bold text-gray-700">
              {yoyPrice.toLocaleString()}원
            </span>
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
            <span style={{ color: '#f87171' }}>▲</span> 최고가
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#f87171' }}>
            {dataMax.toLocaleString()}원
          </span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="text-gray-400">—</span> 평균
          </span>
          <span className="text-[16px] font-bold text-gray-700">{dataAvg.toLocaleString()}원</span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <span className="text-[14px] font-semibold text-gray-700 flex items-center gap-1.5">
            <span style={{ color: '#4ade80' }}>▼</span> 최저가
          </span>
          <span className="text-[16px] font-bold" style={{ color: '#4ade80' }}>
            {dataMin.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  )
}
