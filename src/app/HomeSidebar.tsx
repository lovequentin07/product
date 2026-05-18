import Link from 'next/link'

export default function HomeSidebar() {
  return (
    <aside
      data-testid="home-sidebar"
      className="hidden lg:flex flex-col gap-4"
    >
      {/* 아파트 실거래가 카드 */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#fff', border: '1px solid #E8E3DC', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
      >
        <p
          className="text-xs font-mono font-bold tracking-widest mb-2"
          style={{ color: '#C94B1A', letterSpacing: '0.15em' }}
        >
          REAL ESTATE
        </p>
        <h3
          className="text-lg font-bold mb-1 leading-snug"
          style={{ color: '#1A1918' }}
        >
          아파트 실거래가
        </h3>
        <p className="text-sm mb-4" style={{ color: '#6B6460' }}>
          서울 전체 구별 · 단지별 실거래 내역을 검색하세요
        </p>
        <Link
          href="/apt"
          className="inline-flex items-center justify-center w-full text-sm font-bold rounded-xl py-2.5"
          style={{ background: '#C94B1A', color: '#fff' }}
        >
          조회하기 →
        </Link>
      </div>

      {/* 관리비 지킴이 카드 */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#fff', border: '1px solid #E8E3DC', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
      >
        <p
          className="text-xs font-mono font-bold tracking-widest mb-2"
          style={{ color: '#C94B1A', letterSpacing: '0.15em' }}
        >
          MGMT FEE
        </p>
        <h3
          className="text-lg font-bold mb-1 leading-snug"
          style={{ color: '#1A1918' }}
        >
          관리비 지킴이
        </h3>
        <p className="text-sm mb-4" style={{ color: '#6B6460' }}>
          우리 단지 관리비, 비슷한 단지 대비 비싼지 확인하세요
        </p>
        <Link
          href="/apt-mgmt"
          className="inline-flex items-center justify-center w-full text-sm font-bold rounded-xl py-2.5"
          style={{ background: '#1A1918', color: '#fff' }}
        >
          분석하기 →
        </Link>
      </div>

      {/* AdSense 슬롯 자리 (Phase 04) */}
      <div
        className="rounded-2xl flex items-center justify-center"
        style={{
          border: '1.5px dashed #DDD8D0',
          minHeight: '250px',
          color: '#B5AFA7',
          fontSize: '12px',
        }}
      >
        광고 영역
      </div>
    </aside>
  )
}
