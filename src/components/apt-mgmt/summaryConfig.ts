// src/components/apt-mgmt/summaryConfig.ts
// 관리비 지킴이 — 결과 텍스트 설정
// 이 파일만 편집하면 화면에 표시되는 제목·설명 문구가 바뀝니다.
//
// 템플릿 변수 (동 기준):
//   {apt_nm}      — 아파트 이름 (예: 래미안대치팰리스)
//   {umd_nm}      — 동 이름 (예: 대치동)
//   {umd_rank}    — 동 내 순위
//   {umd_total}   — 동 내 비교 단지 수
//   {umd_percent} — 상위/하위 비율 (정수 %)
//
// 템플릿 변수 (구 기준 fallback):
//   {sgg_nm}      — 구 이름 (예: 강남구)
//   {rank}        — 구 내 순위
//   {total_count} — 구 내 비교 단지 수
//   {percent}     — 상위/하위 비율 (정수 %)

export type Tier = 'A' | 'B' | 'C' | 'D' | 'E';

export interface TierText {
  title: string;         // 동 기준 제목
  desc: string;          // 동 기준 설명
  fallbackTitle: string; // 구 기준 제목 (동 데이터 부족 시)
  fallbackDesc: string;  // 구 기준 설명 (동 데이터 부족 시)
  color: string;         // Tailwind text color class
}

export const tierConfig: Record<Tier, TierText> = {
  A: {
    title: '{apt_nm}, 동네에서 관리비를 가장 잘 아끼고 있어요!',
    desc: '{umd_nm} {umd_total}개 단지 중 {umd_rank}위로, 상위 {umd_percent}%예요.\n관리비가 동네 평균보다 낮아 입주민 부담이 적은 편이에요.\n이사를 고려하고 있다면, 관리비 측면에서 좋은 선택이에요.',
    fallbackTitle: '{apt_nm}, 관리비를 정말 잘 아끼고 있어요!',
    fallbackDesc: '{sgg_nm} {total_count}개 단지 중 {rank}위로, 상위 {percent}%에 해당해요.\n관리비가 구 평균보다 낮아 입주민 부담이 적은 편이에요.\n이사를 고려하고 있다면, 관리비 측면에서 좋은 선택이에요.',
    color: 'text-emerald-500',
  },
  B: {
    title: '{apt_nm}, 동네에서 관리비가 절약되고 있어요',
    desc: '{umd_nm} {umd_total}개 단지 중 {umd_rank}위로, 상위 {umd_percent}%예요.\n동네 평균보다 낮은 수준으로 잘 관리되고 있어요.\n앞으로도 꾸준히 유지된다면 더욱 좋겠죠.',
    fallbackTitle: '{apt_nm}, 관리비가 비교적 절약되고 있어요',
    fallbackDesc: '{sgg_nm} {total_count}개 단지 중 {rank}위로, 상위 {percent}%에 해당해요.\n구 평균보다 조금 낮은 수준으로 잘 관리되고 있어요.\n앞으로도 꾸준히 유지된다면 더욱 좋겠죠.',
    color: 'text-emerald-400',
  },
  C: {
    title: '{apt_nm}, 동네 평균 수준이에요',
    desc: '{umd_nm} {umd_total}개 단지 중 {umd_rank}위예요.\n크게 걱정할 필요는 없지만, 개선 여지는 충분히 있어요.\n경비비·청소비 등 공용관리비 항목을 살펴보면 좋아요.',
    fallbackTitle: '{apt_nm}, {sgg_nm} 평균 수준이에요',
    fallbackDesc: '{sgg_nm} {total_count}개 단지 중 {rank}위로, 딱 중간 수준이에요.\n크게 걱정할 필요는 없지만, 개선 여지는 충분히 있어요.\n경비비·청소비 등 공용관리비 항목을 살펴보면 좋아요.',
    color: 'text-amber-500',
  },
  D: {
    title: '{apt_nm}, 동네에서 관리비가 높은 편이에요',
    desc: '{umd_nm} {umd_total}개 단지 중 {umd_rank}위로, 하위 {umd_percent}%예요.\n동네 평균보다 높은 수준이에요. 공용관리비 항목별로 점검해볼 필요가 있어요.\n관리비 절감 방법을 입주자 대표회의에 건의해보는 것도 좋아요.',
    fallbackTitle: '{apt_nm}, 관리비가 조금 높은 편이에요',
    fallbackDesc: '{sgg_nm} {total_count}개 단지 중 {rank}위로, 하위 {percent}%에 해당해요.\n구 평균보다 높은 수준이에요. 공용관리비 항목별로 점검해볼 필요가 있어요.\n관리비 절감 방법을 입주자 대표회의에 건의해보는 것도 좋아요.',
    color: 'text-red-400',
  },
  E: {
    title: '{apt_nm}, 동네에서 관리비를 꼭 점검해보세요',
    desc: '{umd_nm} {umd_total}개 단지 중 {umd_rank}위로, 하위 {umd_percent}%예요.\n관리비가 동네에서 높은 편이에요.\n공용관리비 세부 내역을 확인하고, 입주자 대표회의에 개선을 요청해보세요.',
    fallbackTitle: '{apt_nm}, 관리비를 꼭 점검해보세요',
    fallbackDesc: '{sgg_nm} {total_count}개 단지 중 {rank}위로, 하위 {percent}%에 해당해요.\n관리비가 구 내에서 높은 편이에요.\n공용관리비 세부 내역을 확인하고, 입주자 대표회의에 개선을 요청해보세요.',
    color: 'text-red-600',
  },
};
