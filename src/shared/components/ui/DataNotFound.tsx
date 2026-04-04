// src/shared/components/ui/DataNotFound.tsx
import Link from 'next/link'

interface DataNotFoundProps {
  /** 페이지 제목. 예: "청담르엘 관리비 정보를 찾을 수 없습니다" */
  title: string
  /** 본문 설명. 예: "해당 아파트의 관리비 데이터가 아직 수집되지 않았습니다." */
  message: string
  /** 데이터 출처 표시. 예: "국토교통부 K-apt" (생략 가능) */
  source?: string
  /** 돌아갈 경로. 예: "/apt-mgmt" */
  backHref: string
  /** 버튼 레이블. 예: "관리비 검색으로 돌아가기" */
  backLabel: string
}

export default function DataNotFound({
  title,
  message,
  source,
  backHref,
  backLabel,
}: DataNotFoundProps) {
  return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-6">🔍</div>
      <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--ds-ink)' }}>
        {title}
      </h2>
      <p className="text-sm mb-1 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--ds-ink-faint)' }}>
        {message}
      </p>
      {source && (
        <p className="text-xs mt-1 mb-8" style={{ color: 'var(--ds-ink-faint)', opacity: 0.6 }}>
          데이터 출처: {source}
        </p>
      )}
      {!source && <div className="mb-8" />}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: 'var(--ds-accent)' }}
      >
        ← {backLabel}
      </Link>
    </div>
  )
}
