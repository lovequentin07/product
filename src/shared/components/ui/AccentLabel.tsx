interface AccentLabelProps {
  children: React.ReactNode
}

export default function AccentLabel({ children }: AccentLabelProps) {
  return (
    <p
      className="text-xs font-mono font-semibold tracking-widest mb-2"
      style={{ color: 'var(--ds-accent)', letterSpacing: '0.15em' }}
    >
      {children}
    </p>
  )
}
