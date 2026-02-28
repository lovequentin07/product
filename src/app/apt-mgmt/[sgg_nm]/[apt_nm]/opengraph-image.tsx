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
          {sggName} 관리비 비교
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
        <div style={{ color: '#bbf7d0', fontSize: 26, marginTop: 24 }}>
          관리비 비교 | DataZip
        </div>
      </div>
    ),
    { ...size }
  );
}
