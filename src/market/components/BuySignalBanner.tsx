'use client'

interface BuySignalBannerProps {
  cheapness_label: string
  cheapnessExplanation: string
}

export default function BuySignalBanner({ cheapness_label, cheapnessExplanation }: BuySignalBannerProps) {
  if (!cheapness_label && !cheapnessExplanation) {
    return null
  }

  // 신호 강도별 스타일 결정
  const isGood = ['역대최저가', '역대최저가 근접', '최저가 구간'].includes(cheapness_label)
  const isWarn = ['높은 가격', '비쌈'].includes(cheapness_label)

  if (isGood) {
    return (
      <div className="mx-4 mt-4 mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg">
        <p className="text-sm font-semibold text-emerald-900 mb-1">{cheapness_label}</p>
        <p className="text-sm text-emerald-800 leading-relaxed">{cheapnessExplanation}</p>
      </div>
    )
  }

  if (isWarn) {
    return (
      <div className="mx-4 mt-4 mb-4 p-4 border-l-4 border-orange-300 bg-orange-50 rounded-lg">
        <p className="text-sm font-semibold text-orange-900 mb-1">{cheapness_label}</p>
        <p className="text-sm text-orange-800 leading-relaxed">{cheapnessExplanation}</p>
      </div>
    )
  }

  // 중간 상태 (저가 / 보통)
  return (
    <div className="mx-4 mt-4 mb-4 p-4 border-l-4 border-slate-300 bg-slate-50 rounded-lg">
      <p className="text-sm text-slate-700 leading-relaxed">{cheapnessExplanation}</p>
    </div>
  )
}
