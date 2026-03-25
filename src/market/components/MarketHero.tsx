import { getAllItems } from '@market/lib/market-data'
import MarketSearchInput from './MarketSearchInput'

export default function MarketHero() {
  const searchItems = getAllItems().map((item) => ({ id: item.id, name: item.name }))

  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-6">
        <h1 className="text-gray-900 font-bold leading-tight mb-5" style={{ fontSize: '32px' }}>
          오늘 장바구니 시세<br />3초 만에 파악하세요
        </h1>
        <MarketSearchInput items={searchItems} />
      </div>
    </div>
  )
}
