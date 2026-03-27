/**
 * src/market/lib/api/kamis-client.ts
 * KAMIS (한국농수산식품유통공사) API 클라이언트
 *
 * API: https://www.kamis.or.kr/service/price/xml.do
 * 참고: 공공데이터포털과 별도 URL, 별도 인증 (p_cert_key + p_cert_id)
 */

import { parseXmlResponse } from '@shared/lib/api/client'

// =====================================================================
// 타입 정의
// =====================================================================

interface KamisDailyPrice {
  item_cd: string
  item_nm: string
  unit_cd: string
  unit_nm: string
  rank: string     // 1=도매, 2=소매
  regday: string   // YYYYMMDD (실제 조회 날짜)
  price: string    // 숫자 (원)
  rpr_price: string // 대표 가격
  diff_rate: string // 전일 대비 변화율
}

interface KamisMonthlyPrice {
  item_cd: string
  item_nm: string
  rank: string
  yyyy: string
  mm: string
  high_price: string
  low_price: string
  avg_price: string
}

interface KamisApiResponse<T> {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items?: T | T[]
      totalCount?: number
    }
  }
}

// =====================================================================
// KAMIS API 클라이언트
// =====================================================================

const KAMIS_BASE_URL = 'https://www.kamis.or.kr/service/price/xml.do'

/**
 * KAMIS 인증 정보 검증 및 설정
 */
function getKamisAuthParams(): { p_cert_id: string; p_cert_key: string } {
  const cert_id = process.env.KAMIS_CERT_ID
  const cert_key = process.env.KAMIS_CERT_KEY

  if (!cert_id || !cert_key) {
    throw new Error(
      'KAMIS API 인증 정보가 없습니다. KAMIS_CERT_ID, KAMIS_CERT_KEY를 .env.local에 설정하세요.'
    )
  }

  return { p_cert_id: cert_id, p_cert_key: cert_key }
}

/**
 * KAMIS API 호출 (공통)
 */
async function callKamisApi<T>(params: Record<string, string>): Promise<T> {
  const auth = getKamisAuthParams()

  const queryParams = new URLSearchParams({
    ...auth,
    ...params,
  })

  const url = `${KAMIS_BASE_URL}?${queryParams.toString()}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const xmlText = await response.text()
    const parsedData = await parseXmlResponse<T>(xmlText)

    return parsedData
  } catch (error) {
    console.error('[KAMIS API Error]', error)
    throw error
  }
}

/**
 * 일일 시세 조회 (소매가)
 * @param item_cd 품목 코드
 * @param regday 조회 날짜 (YYYYMMDD, 생략시 당일)
 * @param sgg_cd 시도 코드 (23개)
 * @returns 해당 품목의 일일 소매가
 */
export async function getKamisDailyPrice(
  item_cd: string,
  sgg_cd: string,
  regday?: string
): Promise<KamisDailyPrice | null> {
  try {
    const params: Record<string, string> = {
      action: 'itemcategorylist',
      p_item_cd: item_cd,
      p_sgg_cd: sgg_cd,
      p_convert_kg_yn: 'Y',
    }

    if (regday) {
      params.p_regday = regday
    }

    const result = await callKamisApi<KamisApiResponse<KamisDailyPrice>>(params)

    // items 배열에서 소매가(rank=2) 찾기
    const items = Array.isArray(result.response.body.items)
      ? result.response.body.items
      : result.response.body.items
      ? [result.response.body.items]
      : []

    const retailPrice = items.find((item) => item.rank === '2')
    return retailPrice || null
  } catch (error) {
    console.warn(`[KAMIS Daily] ${item_cd} ${sgg_cd} 조회 실패:`, error)
    return null
  }
}

/**
 * 월별 시세 조회 (소매가 평균)
 * @param item_cd 품목 코드
 * @param sgg_cd 시도 코드
 * @param startYyyy 시작 년
 * @param endYyyy 종료 년
 * @returns 해당 기간 월별 소매가 배열
 */
export async function getKamisMonthlyPrice(
  item_cd: string,
  sgg_cd: string,
  startYyyy: string,
  endYyyy: string
): Promise<KamisMonthlyPrice[]> {
  try {
    const params: Record<string, string> = {
      action: 'monthlychart',
      p_item_cd: item_cd,
      p_sgg_cd: sgg_cd,
      p_startdate: `${startYyyy}01`,
      p_enddate: `${endYyyy}12`,
      p_convert_kg_yn: 'Y',
    }

    const result = await callKamisApi<KamisApiResponse<KamisMonthlyPrice>>(params)

    const items = Array.isArray(result.response.body.items)
      ? result.response.body.items
      : result.response.body.items
      ? [result.response.body.items]
      : []

    // rank=2 (소매가) 필터링
    return items.filter((item) => item.rank === '2')
  } catch (error) {
    console.warn(`[KAMIS Monthly] ${item_cd} ${sgg_cd} 조회 실패:`, error)
    return []
  }
}

/**
 * 23개 지역 코드 목록
 * (서울 포함, 광역시/도)
 */
export const KAMIS_REGION_CODES = [
  '1101', // 서울
  '2601', // 부산
  '2701', // 대구
  '2801', // 인천
  '2901', // 광주
  '3001', // 대전
  '3101', // 울산
  '3601', // 세종
  '4101', // 경기
  '4201', // 강원
  '4301', // 충북
  '4401', // 충남
  '4501', // 전북
  '4601', // 전남
  '4701', // 경북
  '4801', // 경남
  '5001', // 제주
]

/**
 * 94개 품목 코드 (예시, 실제 KAMIS에서 확인 필요)
 * 여기서는 기존 JSON의 item_cd 그대로 사용
 */
export const KAMIS_ITEM_CODES = [
  '111', '112', '113', '114', '115', '121', '122', '123', '124', '125',
  '126', '131', '132', '141', '142', '151', '152', '161', '162', '171',
  '181', '191', '211', '212', '213', '214', '215', '216', '217', '218',
  '219', '221', '222', '223', '224', '225', '226', '231', '232', '233',
  '234', '235', '241', '242', '251', '261', '271', '281', '301', '302',
  '303', '304', '305', '306', '307', '308', '311', '312', '313', '314',
  '315', '316', '321', '322', '331', '332', '333', '334', '341', '342',
  '343', '344', '345', '346', '347', '351', '352', '353', '354', '355',
  '356', '357', '361', '362', '363', '364', '365', '366', '367', '368',
  '369', '370', '371', '372', '381', '382', '383', '384', '385', '386',
]

/**
 * 배치 조회: 모든 지역×품목 일일 시세
 * @param onProgress 진행도 콜백
 * @returns 모든 조회 결과 (성공/실패 섞임)
 */
export async function fetchAllKamisDailyPrices(
  onProgress?: (current: number, total: number) => void
): Promise<(KamisDailyPrice | null)[]> {
  const results: (KamisDailyPrice | null)[] = []
  const total = KAMIS_REGION_CODES.length * KAMIS_ITEM_CODES.length

  let current = 0

  for (const sgg_cd of KAMIS_REGION_CODES) {
    for (const item_cd of KAMIS_ITEM_CODES) {
      const price = await getKamisDailyPrice(item_cd, sgg_cd)
      results.push(price)

      current++
      if (onProgress) {
        onProgress(current, total)
      }

      // Rate limiting: 300ms 대기
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return results
}

/**
 * 배치 조회: 모든 지역×품목 월별 시세
 * @param startYyyy 시작 년
 * @param endYyyy 종료 년
 * @param onProgress 진행도 콜백
 * @returns 모든 조회 결과
 */
export async function fetchAllKamisMonthlyPrices(
  startYyyy: string,
  endYyyy: string,
  onProgress?: (current: number, total: number) => void
): Promise<KamisMonthlyPrice[][]> {
  const results: KamisMonthlyPrice[][] = []
  const total = KAMIS_REGION_CODES.length * KAMIS_ITEM_CODES.length

  let current = 0

  for (const sgg_cd of KAMIS_REGION_CODES) {
    for (const item_cd of KAMIS_ITEM_CODES) {
      const prices = await getKamisMonthlyPrice(item_cd, sgg_cd, startYyyy, endYyyy)
      results.push(prices)

      current++
      if (onProgress) {
        onProgress(current, total)
      }

      // Rate limiting: 300ms 대기
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  return results
}
