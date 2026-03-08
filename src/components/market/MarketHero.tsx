import MarketSearchInput from './MarketSearchInput'

export default function MarketHero() {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-8">
        <h1 className="text-gray-900 font-bold leading-tight mb-5" style={{ fontSize: '32px' }}>
          오늘 장바구니 시세<br />3초 만에 파악하세요
        </h1>
        <MarketSearchInput />
        <a
          href="#price-drop-section"
          className="text-gray-400 text-xs text-center w-full block mt-3"
        >
          ↓ 지금 저렴한 품목 바로 보기
        </a>
      </div>
    </div>
  )
}
