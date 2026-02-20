// src/lib/db/apt.ts
// 아파트 상세 이력 조회 (Page 2용)
// D1 연결 후 이 함수 내부만 교체하면 됨

import { AptHistoryResult } from './types';
import { MOCK_APT_HISTORY } from './mock-data';

/**
 * 특정 아파트의 전체 거래 이력 + 집계 데이터 조회
 * @param sgg_cd 시군구 코드 (예: 11710)
 * @param apt_nm 아파트명 (예: 포레나송파)
 * @param months 조회 개월 수 (기본: 24)
 */
export async function getAptHistory(
  sgg_cd: string,
  apt_nm: string,
  months: number = 24
): Promise<AptHistoryResult | null> {
  // D1 미연결 시 Mock 반환
  // apt_nm과 관계없이 같은 Mock을 반환하되, aptName은 실제 요청값으로 대체
  void sgg_cd;
  void months;

  return {
    ...MOCK_APT_HISTORY,
    aptName: decodeURIComponent(apt_nm),
  };
}
