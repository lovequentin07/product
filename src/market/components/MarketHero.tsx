import regionStatsRaw from '@market/data/market-stats-by-region.json'
import MarketSearchInput from './MarketSearchInput'

export default function MarketHero() {
  // 정적 JSON에서 아이템 리스트 추출 (검색용, item_cd 중복 제거)
  type RegionStatRecord = { item_cd: string; item_nm: string }
  const regionStats = regionStatsRaw as RegionStatRecord[]
  const seenItemCds = new Set<string>()
  const searchItems = regionStats
    .filter((r) => {
      if (seenItemCds.has(r.item_cd)) return false
      seenItemCds.add(r.item_cd)
      return true
    })
    .map((r) => ({ id: r.item_cd, name: r.item_nm }))

  return (
    <div>
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-6">
        <h1 className="text-gray-900 font-bold leading-tight mb-5" style={{ fontSize: '32px' }}>
          오늘 장바구니 시세<br />3초 만에 파악하세요
        </h1>
        <MarketSearchInput items={searchItems} />
      </div>
    </div>
  )
}
