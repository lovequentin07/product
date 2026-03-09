// 순수 SVG 스파크라인 — 'use client' 불필요, 서버 컴포넌트에서도 사용 가능

interface Props {
  data?: number[]       // 메인 라인 (선택, 미사용 시 생략)
  minData?: number[]    // 월별 최저가 12포인트 → 빨간 라인
  maxData?: number[]    // 월별 최고가 12포인트 → 초록 라인
  height?: number
  isDown?: boolean      // 메인 라인 색상 결정 (minData/maxData만 쓸 때 무관)
  showArea?: boolean
}

export default function Sparkline({ data, minData, maxData, height = 28, isDown = true, showArea = false }: Props) {
  const allValues = [...(data ?? []), ...(minData ?? []), ...(maxData ?? [])]
  if (allValues.length < 2) return null

  const W = 200
  const H = height
  const PAD = 3

  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const toY = (v: number) => H - PAD - ((v - minVal) / range) * (H - PAD * 2)
  const toX = (i: number, len: number) => PAD + (i / (len - 1)) * (W - PAD * 2)

  // 메인 라인 (선택)
  const mainPts = (data ?? []).map((v, i) => ({ x: toX(i, data!.length), y: toY(v) }))
  const mainPolyline = mainPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const stroke = isDown ? '#2563eb' : '#f97316'
  const fillColor = isDown ? '#2563eb18' : '#f9731618'
  const areaPath = showArea && mainPts.length >= 2
    ? `M ${mainPts[0].x.toFixed(1)},${H} ` +
      mainPts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${mainPts[mainPts.length - 1].x.toFixed(1)},${H} Z`
    : ''

  // 최저가 라인 (빨간)
  const minPts = (minData ?? []).map((v, i) => ({ x: toX(i, minData!.length), y: toY(v) }))
  const minPolyline = minPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // 최고가 라인 (초록)
  const maxPts = (maxData ?? []).map((v, i) => ({ x: toX(i, maxData!.length), y: toY(v) }))
  const maxPolyline = maxPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {/* 메인 라인 영역 */}
      {showArea && areaPath && <path d={areaPath} fill={fillColor} />}

      {/* 최고가 라인 + dots (초록) */}
      {maxPts.length >= 2 && (
        <>
          <polyline
            points={maxPolyline}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {maxPts.map((p, i) => (
            <circle key={`max-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#22c55e" vectorEffect="non-scaling-stroke" />
          ))}
        </>
      )}

      {/* 최저가 라인 + dots (빨간) */}
      {minPts.length >= 2 && (
        <>
          <polyline
            points={minPolyline}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {minPts.map((p, i) => (
            <circle key={`min-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#ef4444" vectorEffect="non-scaling-stroke" />
          ))}
        </>
      )}

      {/* 메인 라인 (선택) */}
      {mainPts.length >= 2 && (
        <polyline
          points={mainPolyline}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
