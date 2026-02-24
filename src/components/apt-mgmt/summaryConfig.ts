// src/components/apt-mgmt/summaryConfig.ts
// 관리비 지킴이 — 요약 카드 텍스트 설정
// 이 파일만 편집하면 화면에 표시되는 레이블·설명 문구가 바뀝니다.
//
// desc 템플릿 변수:
//   {score}       — 관리비 지킴 점수 (0~100)
//   {sgg_nm}      — 구 이름 (예: 강남구)
//   {total_count} — 구 내 비교 단지 수
//   {rank}        — 구 내 순위 (낮을수록 절약)
//   {percent}     — 상위/하위 비율 (정수 %)

export type Verdict = '상' | '중' | '하';

export interface VerdictText {
  label: string;
  desc: string;
}

export const resultSummaryConfig = {
  score: {
    options: {
      '상': {
        label: '점수 높음 · 관리비 절약 🟢',
        desc: '관리비 지킴 점수 {score}점. {sgg_nm} {total_count}개 단지 중 {rank}위로 상위 {percent}%입니다. 관리비를 잘 절약하고 있어요!',
      },
      '중': {
        label: '점수 보통 · 평균 🟡',
        desc: '관리비 지킴 점수 {score}점. {sgg_nm} {total_count}개 중 {rank}위로 상위 {percent}% 수준입니다. 무난한 편이지만, 더 아낄 여지는 있어요.',
      },
      '하': {
        label: '점수 낮음 · 관리비 경보 🔴',
        desc: '관리비 지킴 점수 {score}점. {sgg_nm} {total_count}개 단지 중 {rank}위로 하위 {percent}%입니다. 관리비 점검이 필요합니다.',
      },
    } satisfies Record<Verdict, VerdictText>,
  },
};
