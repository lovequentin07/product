/**
 * src/lib/region.ts
 * Cloudflare CF-IPCity 헤더 → sgg_cd 매핑
 * market-stats-by-region.json의 실제 등장 지역 기반
 */

export const DEFAULT_SGG = '1101'

export const SUPPORTED_REGIONS: { sgg_cd: string; sgg_nm: string }[] = [
  { sgg_cd: '1101', sgg_nm: '서울' },
  { sgg_cd: '2100', sgg_nm: '부산' },
  { sgg_cd: '2200', sgg_nm: '대구' },
  { sgg_cd: '2300', sgg_nm: '인천' },
  { sgg_cd: '2401', sgg_nm: '광주' },
  { sgg_cd: '2501', sgg_nm: '대전' },
  { sgg_cd: '2601', sgg_nm: '울산' },
  { sgg_cd: '2701', sgg_nm: '세종' },
  { sgg_cd: '3111', sgg_nm: '수원' },
  { sgg_cd: '3112', sgg_nm: '성남' },
  { sgg_cd: '3138', sgg_nm: '고양' },
  { sgg_cd: '3145', sgg_nm: '용인' },
  { sgg_cd: '3211', sgg_nm: '춘천' },
  { sgg_cd: '3214', sgg_nm: '강릉' },
  { sgg_cd: '3311', sgg_nm: '청주' },
  { sgg_cd: '3411', sgg_nm: '천안' },
  { sgg_cd: '3511', sgg_nm: '전주' },
  { sgg_cd: '3613', sgg_nm: '순천' },
  { sgg_cd: '3711', sgg_nm: '포항' },
  { sgg_cd: '3714', sgg_nm: '안동' },
  { sgg_cd: '3814', sgg_nm: '창원' },
  { sgg_cd: '3818', sgg_nm: '김해' },
  { sgg_cd: '3911', sgg_nm: '제주' },
]

// Cloudflare CF-IPCity 영문 도시명 → sgg_cd
// CF-IPCity는 영문 도시명을 반환 (예: "Seoul", "Busan")
const CITY_TO_SGG: Record<string, string> = {
  // 특별·광역시
  'Seoul': '1101',
  'Busan': '2100',
  'Daegu': '2200',
  'Incheon': '2300',
  'Gwangju': '2401',
  'Daejeon': '2501',
  'Ulsan': '2601',
  'Sejong': '2701',
  'Sejong-si': '2701',
  // 경기도
  'Suwon': '3111',
  'Suwon-si': '3111',
  'Seongnam-si': '3112',
  'Goyang-si': '3138',
  'Yongin-si': '3145',
  // 강원도
  'Chuncheon': '3211',
  'Gangneung': '3214',
  // 충청북도
  'Cheongju-si': '3311',
  'Cheongju': '3311',
  // 충청남도
  'Cheonan': '3411',
  'Cheonan-si': '3411',
  // 전라북도
  'Jeonju': '3511',
  'Jeonju-si': '3511',
  // 전라남도
  'Suncheon': '3613',
  'Suncheon-si': '3613',
  // 경상북도
  'Pohang': '3711',
  'Pohang-si': '3711',
  'Andong': '3714',
  'Andong-si': '3714',
  // 경상남도
  'Changwon': '3814',
  'Changwon-si': '3814',
  'Gimhae': '3818',
  'Gimhae-si': '3818',
  // 제주
  'Jeju': '3911',
  'Jeju City': '3911',
  'Jeju-si': '3911',
}

export function detectRegion(headers: Headers): string {
  const city = headers.get('CF-IPCity') ?? ''
  return CITY_TO_SGG[city] ?? DEFAULT_SGG
}
