import Link from 'next/link'
import TrustStrip from './TrustStrip'

interface ServiceLayoutProps {
  children: React.ReactNode
  /** content 영역 클래스 오버라이드. 기본: max-w-2xl mx-auto px-5 pt-6 pb-24 */
  contentClassName?: string
}

export default function ServiceLayout({
  children,
  contentClassName = 'max-w-2xl mx-auto px-5 pt-6 pb-24',
}: ServiceLayoutProps) {
  return (
    <div style={{ background: 'var(--ds-cream)', minHeight: '100vh' }}>
      {/* 헤더 */}
      <header className="max-w-2xl mx-auto px-5 pt-8 pb-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold"
          style={{ color: 'var(--ds-ink)', letterSpacing: '0.12em' }}
        >
          datazip
        </Link>
        <span
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--ds-ink-faint)' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-live-pulse"
            style={{ background: 'var(--ds-accent)' }}
          />
          매일 업데이트
        </span>
      </header>

      {/* 주홍 구분선 */}
      <div
        className="max-w-2xl mx-auto px-5"
        style={{ marginBottom: '12px' }}
      >
        <div style={{ height: '1px', background: 'var(--ds-accent)' }} />
      </div>

      {/* 신뢰 스트립 */}
      <TrustStrip />

      <div style={{ marginBottom: '20px' }} />

      {/* 콘텐츠 */}
      <main className={contentClassName}>
        {children}
      </main>
    </div>
  )
}
