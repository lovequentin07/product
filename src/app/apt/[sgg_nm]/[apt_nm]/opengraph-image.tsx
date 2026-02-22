import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ sgg_nm: string; apt_nm: string }>;
}) {
  const { sgg_nm, apt_nm } = await params;
  const aptName = decodeURIComponent(apt_nm);
  const sggName = decodeURIComponent(sgg_nm);

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
        <div style={{ color: '#93c5fd', fontSize: 28, marginBottom: 16 }}>
          {sggName} 아파트 실거래가
        </div>
        <div
          style={{
            color: 'white',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {aptName}
        </div>
        <div style={{ color: '#bfdbfe', fontSize: 26, marginTop: 24 }}>
          DataZip · 전체 거래 이력 조회
        </div>
      </div>
    ),
    { ...size }
  );
}
