import Link from 'next/link'

interface PrimaryButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  variant?: 'solid' | 'outline'
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export default function PrimaryButton({
  href,
  onClick,
  children,
  variant = 'solid',
  className = '',
  type = 'button',
  disabled = false,
}: PrimaryButtonProps) {
  const solidStyle = {
    background: 'var(--ds-accent)',
    color: '#FFFFFF',
    border: 'none',
  }
  const outlineStyle = {
    background: 'transparent',
    color: 'var(--ds-accent)',
    border: '1px solid var(--ds-accent)',
  }
  const baseClass = `inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${className}`

  if (href) {
    return (
      <Link href={href} className={baseClass} style={variant === 'solid' ? solidStyle : outlineStyle}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClass}
      style={variant === 'solid' ? solidStyle : outlineStyle}
    >
      {children}
    </button>
  )
}
