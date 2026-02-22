import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DataZip - 서울 아파트 실거래가 조회';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div style={{ color: 'white', fontSize: 72, fontWeight: 'bold', letterSpacing: '-2px' }}>
          DataZip
        </div>
        <div style={{ color: '#93c5fd', fontSize: 36, marginTop: 24 }}>
          서울 아파트 실거래가 조회
        </div>
        <div style={{ color: '#bfdbfe', fontSize: 26, marginTop: 16 }}>
          국토교통부 공공데이터 · 131만건
        </div>
      </div>
    ),
    { ...size }
  );
}
