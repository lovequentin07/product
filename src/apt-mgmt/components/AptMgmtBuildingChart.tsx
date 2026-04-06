'use client';

// 서울 전체 피어 그룹 건물 시각화 컴포넌트
// 최저/평균/우리/최고 4개 건물을 높이 비례로 표현

interface Props {
  ourValue: number;      // 우리 단지 total_per_hh (원/세대/월)
  peerMin: number;
  peerAvg: number;
  peerMax: number;
  peerCnt: number;
  scopeLabel: string;    // '서울 전체' | '강남구' | '대치동'
}

const fmt = (v: number) => `${Math.round(v / 1000).toLocaleString()}천원`;

export default function AptMgmtBuildingChart({
  ourValue,
  peerMin,
  peerAvg,
  peerMax,
  peerCnt,
  scopeLabel,
}: Props) {
  const MAX_HEIGHT = 120; // px — 최고 건물 높이

  const buildings = [
    { key: 'min',  label: '최저',  value: peerMin,  color: '#4ade80', textColor: '#166534' },
    { key: 'avg',  label: '평균',  value: peerAvg,  color: '#94a3b8', textColor: '#334155' },
    { key: 'our',  label: '우리',  value: ourValue,  color: ourValue > peerAvg ? '#f87171' : '#60a5fa', textColor: ourValue > peerAvg ? '#991b1b' : '#1e3a5f' },
    { key: 'max',  label: '최고',  value: peerMax,  color: '#fca5a5', textColor: '#7f1d1d' },
  ];

  const maxValue = Math.max(...buildings.map(b => b.value));

  return (
    <div className="w-full">
      <p className="text-xs mb-4" style={{ color: 'var(--ds-ink-faint)' }}>
        {scopeLabel} 유사 단지 {peerCnt}곳 비교
      </p>

      {/* 건물 차트 */}
      <div className="flex items-end justify-around gap-3 px-2" style={{ height: `${MAX_HEIGHT + 48}px` }}>
        {buildings.map((b) => {
          const height = Math.max(16, Math.round((b.value / maxValue) * MAX_HEIGHT));
          const isOur = b.key === 'our';

          return (
            <div key={b.key} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              {/* 가격 레이블 */}
              <span
                className="text-xs font-semibold"
                style={{ color: b.textColor, whiteSpace: 'nowrap' }}
              >
                {fmt(b.value)}
              </span>

              {/* 우리 단지 배지 */}
              {isOur && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: b.color,
                    color: '#fff',
                    fontSize: '10px',
                  }}
                >
                  우리 단지
                </span>
              )}

              {/* 건물 본체 */}
              <div
                style={{
                  width: '100%',
                  height: `${height}px`,
                  background: b.color,
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  opacity: isOur ? 1 : 0.75,
                  border: isOur ? `2px solid ${b.textColor}` : 'none',
                }}
              >
                {/* 창문 패턴 */}
                {height >= 32 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '6px 4px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '3px',
                      alignContent: 'start',
                    }}
                  >
                    {Array.from({ length: Math.min(8, Math.floor(height / 10)) }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: '5px',
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: '1px',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 건물 라벨 */}
              <span
                className="text-xs font-medium mt-1"
                style={{ color: isOur ? b.textColor : 'var(--ds-ink-muted)' }}
              >
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 지면선 */}
      <div
        className="mt-0 mb-1"
        style={{ height: '2px', background: 'var(--ds-cream-border)' }}
      />
    </div>
  );
}
