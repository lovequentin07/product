'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@market/types/market'

interface CategoryOption {
  value: Category | 'all'
  label: string
}

const CATEGORIES: CategoryOption[] = [
  { value: 'all', label: '전체' },
  { value: 'vegetable', label: '채소' },
  { value: 'grain', label: '곡물' },
  { value: 'fruit', label: '과일' },
  { value: 'seafood', label: '수산' },
  { value: 'food', label: '식품' },
  { value: 'special', label: '특용' },
]

export default function CategoryQuickAccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') ?? 'all'

  function handleSelect(value: Category | 'all') {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    const qs = params.toString()
    router.push(`/market${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <div className="flex gap-0 overflow-x-auto scrollbar-none pb-0 pt-3 border-b border-gray-100">
      {CATEGORIES.map(({ value, label }) => {
        const isActive = current === value || (value === 'all' && current === 'all')
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleSelect(value)}
            className={`shrink-0 px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
              isActive
                ? 'border-(--ds-accent) font-semibold'
                : 'border-transparent text-gray-400 font-normal'
            }`}
            style={isActive ? { color: 'var(--ds-accent)' } : undefined}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
