// src/components/apt-mgmt/AptMgmtTopAptRecommend.tsx
// 동네/서울 관리비 절약 1위 추천 카드

import Link from 'next/link';
import { MgmtFeeTopApt } from '@/types/management-fee';

interface Props {
  topApts: { umd: MgmtFeeTopApt | null; seoul: MgmtFeeTopApt | null };
  currentUmdNm: string | null;
  currentUmdRank: number | null;
  currentSeoulRank: number | null;
}

function TopAptCard({
  icon, title, apt, showDistrict = false,
}: {
  icon: string;
  title: string;
  apt: MgmtFeeTopApt;
  showDistrict?: boolean;
}) {
  const href = `/apt-mgmt/${encodeURIComponent(apt.sgg_nm)}/${encodeURIComponent(apt.apt_nm)}?kaptCode=${apt.kapt_code}`;
  const aptLabel = showDistrict && apt.umd_nm
    ? `${apt.apt_nm} (${apt.sgg_nm} ${apt.umd_nm})`
    : apt.apt_nm;

  return (
    <Link
      href={href}
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
    >
      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
        {icon} {title}
      </p>
      <p className="text-base font-bold text-gray-800 dark:text-gray-100">{aptLabel}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        월 {apt.total_per_hh.toLocaleString()}원/세대 · 비교하기 →
      </p>
    </Link>
  );
}

export default function AptMgmtTopAptRecommend({
  topApts, currentUmdNm, currentUmdRank, currentSeoulRank,
}: Props) {
  // 서울 1위면 카드 전체 숨김
  if (currentSeoulRank === 1) return null;

  const { umd, seoul } = topApts;
  // 동 1위가 서울 1위와 같은 단지면 서울 카드만 표시
  const showUmd = umd !== null && currentUmdRank !== 1 && umd.kapt_code !== seoul?.kapt_code;
  const showSeoul = seoul !== null;

  if (!showUmd && !showSeoul) return null;

  return (
    <div className="space-y-3">
      {showUmd && (
        <TopAptCard
          icon="💚"
          title={`${currentUmdNm ?? ''} 관리비 절약 1위`}
          apt={umd!}
        />
      )}
      {showSeoul && (
        <TopAptCard
          icon="🏆"
          title="서울시 관리비 절약 1위"
          apt={seoul!}
          showDistrict
        />
      )}
    </div>
  );
}
