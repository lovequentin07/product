export default function TrustStrip() {
  return (
    <div
      data-testid="trust-strip"
      className="max-w-2xl mx-auto px-5 flex items-center justify-between flex-wrap gap-2"
      style={{
        background: '#1A1918',
        padding: '7px 20px',
        fontSize: '11px',
        color: '#9A9085',
        fontWeight: 500,
      }}
    >
      <span>
        <span style={{ color: '#C8C0B8', fontWeight: 600 }}>
          공공데이터포털 · KAMIS · K-APT
        </span>
        {' '}| 매일 자동 갱신
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(4,120,87,0.25)',
          color: '#6EE7B7',
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '20px',
        }}
      >
        ✓ 정상
      </span>
    </div>
  )
}
