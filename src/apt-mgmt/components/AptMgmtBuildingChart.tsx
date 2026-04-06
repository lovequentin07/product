'use client';

// 서울 전체 피어 그룹 건물 시각화 컴포넌트

interface Props {
  ourValue: number;
  peerMin: number;
  peerAvg: number;
  peerMax: number;
  peerCnt: number;
}

function fmtMan(v: number) {
  const man = Math.round(v / 10000);
  return `${man}만원`;
}

interface BuildingProps {
  value: number;
  maxValue: number;
  color: string;
  windowColor: string;
  label: string;
  isOur?: boolean;
}

function Building({ value, maxValue, color, windowColor, label, isOur }: BuildingProps) {
  const MAX_H = 130;
  const MIN_H = 28;
  const height = Math.max(MIN_H, Math.round((value / maxValue) * MAX_H));
  const floors = Math.max(2, Math.floor(height / 16));

  return (
    <div className="flex flex-col items-center gap-1" style={{ flex: '0 0 72px' }}>
      {/* 금액 */}
      <span
        className="text-xs font-bold text-center"
        style={{ color: isOur ? '#b91c1c' : '#475569', whiteSpace: 'nowrap' }}
      >
        {fmtMan(value)}
      </span>

      {/* 우리 단지 배지 */}
      {isOur ? (
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: '#ef4444', color: '#fff', fontSize: '10px' }}
        >
          우리 단지
        </span>
      ) : (
        <span style={{ height: '20px' }} />
      )}

      {/* 건물 */}
      <div style={{ position: 'relative', width: '52px' }}>
        {/* 옥상 */}
        <div
          style={{
            width: '100%',
            height: '5px',
            background: color,
            borderRadius: '3px 3px 0 0',
            filter: 'brightness(0.85)',
          }}
        />
        {/* 본체 */}
        <div
          style={{
            width: '100%',
            height: `${height}px`,
            background: color,
            border: isOur ? '2px solid #b91c1c' : '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* 창문 그리드 */}
          <div
            style={{
              position: 'absolute',
              inset: '6px 6px 4px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: `repeat(${floors}, 1fr)`,
              gap: '3px',
            }}
          >
            {Array.from({ length: 3 * floors }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: windowColor,
                  borderRadius: '1px',
                }}
              />
            ))}
          </div>
        </div>
        {/* 지면 */}
        <div
          style={{
            width: '110%',
            marginLeft: '-5%',
            height: '3px',
            background: '#cbd5e1',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* 라벨 */}
      <span
        className="text-xs font-medium"
        style={{ color: isOur ? '#991b1b' : '#64748b' }}
      >
        {label}
      </span>
    </div>
  );
}

export default function AptMgmtBuildingChart({ ourValue, peerMin, peerAvg, peerMax, peerCnt }: Props) {
  const maxValue = Math.max(peerMax, ourValue);

  return (
    <div className="w-full">
      <p className="text-xs mb-4" style={{ color: 'var(--ds-ink-faint)' }}>
        유사 단지 {peerCnt}곳과 비교
      </p>
      <div className="flex items-end justify-around gap-2">
        <Building value={peerMin} maxValue={maxValue} color="#4ade80" windowColor="rgba(255,255,255,0.7)" label="최저" />
        <Building value={peerAvg} maxValue={maxValue} color="#94a3b8" windowColor="rgba(255,255,255,0.55)" label="평균" />
        <Building value={ourValue} maxValue={maxValue} color="#f87171" windowColor="rgba(255,255,255,0.5)" label="우리" isOur />
        <Building value={peerMax} maxValue={maxValue} color="#fca5a5" windowColor="rgba(255,255,255,0.45)" label="최고" />
      </div>
    </div>
  );
}
