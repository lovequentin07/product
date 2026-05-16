'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchItem {
  id: string
  name: string
}

interface Props {
  items: SearchItem[]
}

export default function MarketSearchInput({ items }: Props) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const found = items.find((item) => item.name.includes(trimmed) || item.id === trimmed)
    if (found) router.push(`/market/${encodeURIComponent(found.name)}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center bg-transparent border-b border-gray-200 focus-within:border-(--ds-accent) px-0 h-11 transition-colors">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="시금치, 딸기, 고등어..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none ml-2"
        />
      </div>
    </form>
  )
}
