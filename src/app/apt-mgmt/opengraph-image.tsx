import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '관리비 지킴이 - 우리 아파트 관리비 비교 분석';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div style={{ color: '#86efac', fontSize: 28, marginBottom: 16 }}>
          K-apt 공공데이터 기반
        </div>
        <div style={{ color: 'white', fontSize: 72, fontWeight: 'bold', letterSpacing: '-2px' }}>
          관리비 지킴이
        </div>
        <div style={{ color: '#bbf7d0', fontSize: 34, marginTop: 24, textAlign: 'center' }}>
          우리 아파트 관리비, 동네 평균과 비교
        </div>
        <div style={{ color: '#86efac', fontSize: 24, marginTop: 20 }}>
          DataZip
        </div>
      </div>
    ),
    { ...size }
  );
}
