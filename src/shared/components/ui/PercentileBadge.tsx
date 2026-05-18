interface Props {
  percentile: number // 0~1
  showLabel?: boolean
}

type Level = 'deep' | 'shallow' | 'mid' | 'high'

function getLevel(p: number): Level {
  if (p <= 0.10) return 'deep'
  if (p <= 0.25) return 'shallow'
  if (p <= 0.60) return 'mid'
  return 'high'
}

const LEVEL_STYLES: Record<Level, { bg: string; color: string; label: string }> = {
  deep:    { bg: '#D1FAE5', color: '#065F46', label: '최저가' },
  shallow: { bg: '#ECFDF5', color: '#047857', label: '저렴'   },
  mid:     { bg: '#F3F0EB', color: '#78716C', label: '보통'   },
  high:    { bg: '#FFFBEB', color: '#92400E', label: '고가'   },
}

export default function PercentileBadge({ percentile, showLabel = true }: Props) {
  const pct = Math.round(percentile * 100)
  const level = getLevel(percentile)
  const { bg, color, label } = LEVEL_STYLES[level]

  return (
    <span
      style={{ background: bg, color }}
      className="inline-flex flex-col items-center justify-center text-center font-mono font-bold rounded-lg px-2 py-1 min-w-[56px] leading-tight"
    >
      <span style={{ fontSize: '11px' }}>하위 {pct}%</span>
      {showLabel && (
        <span style={{ fontSize: '9px', fontWeight: 500, opacity: 0.85 }}>{label}</span>
      )}
    </span>
  )
}
