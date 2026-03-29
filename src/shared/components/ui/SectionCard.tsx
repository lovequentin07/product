interface SectionCardProps {
  children: React.ReactNode
  className?: string
}

export default function SectionCard({ children, className = '' }: SectionCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: 'var(--ds-cream-card)',
        border: '1px solid var(--ds-cream-border)',
      }}
    >
      {children}
    </div>
  )
}
