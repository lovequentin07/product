// 순수 SVG 스파크라인 — 'use client' 불필요, 서버 컴포넌트에서도 사용 가능

interface Props {
  data: number[]
  height?: number
  isDown?: boolean   // 하락 트렌드 여부 (색상 결정)
  showArea?: boolean // 라인 아래 채우기
}

export default function Sparkline({ data, height = 28, isDown = true, showArea = false }: Props) {
  if (data.length < 2) return null

  const W = 200
  const H = height
  const PAD = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  }))

  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const stroke = isDown ? '#2563eb' : '#f97316'   // blue-600 / orange-500
  const fillColor = isDown ? '#2563eb18' : '#f9731618'

  const areaPath = showArea
    ? `M ${pts[0].x.toFixed(1)},${H} ` +
      pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${H} Z`
    : ''

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {showArea && areaPath && <path d={areaPath} fill={fillColor} />}
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
