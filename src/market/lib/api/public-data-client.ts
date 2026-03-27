/**
 * src/market/lib/api/public-data-client.ts
 * 공공데이터포털 농산물 가격 API 클라이언트
 *
 * API: https://apis.data.go.kr/B552845/perYearMonth/price
 * 인증: DATA_GO_KR_API_KEY (환경변수)
 */

import { callPublicDataApi } from '@shared/lib/api/client'

// =====================================================================
// 타입 정의
// =====================================================================

export interface PriceItem {
  exmn_ym: string    // 연월 (YYYYMM)
  ctgry_cd: string   // 카테고리 코드
  ctgry_nm: string   // 카테고리 명
  se_cd: string      // 구분 ('01'=소매, '02'=도매)
  se_nm: string      // 구분 명
  item_cd: string    // 품목 코드
  item_nm: string    // 품목 명
  vrty_cd: string    // 신선도 코드
  vrty_nm: string    // 신선도 명
  grd_cd: string     // 등급 코드
  grd_nm: string     // 등급 명
  unit: string       // 단위 (kg, 개 등)
  unit_sz: string    // 단위크기
  pmm_avgprc: string // 월평균 가격
  pmm_hgprc: string  // 월최고가
  pmm_lwprc: string  // 월최저가
}

interface PublicDataResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      totalCount: number
      items?: {
        item: PriceItem | PriceItem[]
      }
    }
  }
}

// =====================================================================
// 공공데이터 API 호출
// =====================================================================

const API_PATH = '/B552845/perYearMonth/price'
const PAGE_SIZE = 1000

/**
 * 공공데이터포털 농산물 가격 API 호출
 * @param startYm 시작 연월 (YYYYMM)
 * @param endYm 종료 연월 (YYYYMM)
 * @param pageNo 페이지 번호 (기본값 1)
 * @returns 가격 데이터 배열
 */
export async function fetchPublicDataPrices(
  startYm: string,
  endYm: string,
  pageNo: number = 1
): Promise<{ items: PriceItem[]; totalCount: number }> {
  try {
    const params: Record<string, string | number> = {
      numOfRows: PAGE_SIZE,
      pageNo,
      'cond[exmn_ym::GTE]': startYm,
      'cond[exmn_ym::LTE]': endYm,
    }

    const response = await callPublicDataApi<PublicDataResponse>(API_PATH, params)

    const totalCount = response?.response?.body?.totalCount || 0
    const raw = response?.response?.body?.items?.item

    if (!raw) {
      return { items: [], totalCount }
    }

    const items = Array.isArray(raw) ? raw : [raw]
    return { items, totalCount }
  } catch (error) {
    console.error('[Public Data API Error]', error)
    throw error
  }
}

/**
 * 배치 조회: 모든 페이지의 데이터 수집
 * @param startYm 시작 연월
 * @param endYm 종료 연월
 * @param onProgress 진행도 콜백
 * @returns 모든 가격 데이터
 */
export async function fetchAllPublicDataPrices(
  startYm: string,
  endYm: string,
  onProgress?: (current: number, total: number) => void
): Promise<PriceItem[]> {
  const allItems: PriceItem[] = []
  let pageNo = 1
  let totalCount = Infinity

  while (allItems.length < totalCount) {
    try {
      const { items, totalCount: total } = await fetchPublicDataPrices(startYm, endYm, pageNo)
      totalCount = total

      allItems.push(...items)

      if (onProgress) {
        onProgress(allItems.length, totalCount)
      }

      if (items.length === 0) break

      pageNo++

      // Rate limiting: 200ms 대기
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`[공공데이터 조회 실패] 페이지 ${pageNo}:`, error)
      throw error
    }
  }

  return allItems
}

/**
 * 데이터 필터링: 소매가('01')만 추출
 */
export function filterRetailPrices(items: PriceItem[]): PriceItem[] {
  return items.filter((item) => item.se_cd === '01')
}

/**
 * 데이터 필터링: 특정 기간의 데이터만 추출
 */
export function filterByMonth(items: PriceItem[], month: string): PriceItem[] {
  return items.filter((item) => item.exmn_ym === month)
}

/**
 * 데이터 필터링: 특정 품목의 데이터만 추출
 */
export function filterByItem(items: PriceItem[], itemCd: string): PriceItem[] {
  return items.filter((item) => item.item_cd === itemCd)
}

/**
 * 데이터 필터링: 특정 지역(시도)의 데이터만 추출
 * ⚠️ 공공데이터 API는 지역 정보를 포함하지 않음 → 별도 처리 필요
 */
export function groupByItem(items: PriceItem[]): Map<string, PriceItem[]> {
  const map = new Map<string, PriceItem[]>()

  for (const item of items) {
    const key = item.item_cd
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(item)
  }

  return map
}

/**
 * 데이터 그룹화: 연월별 그룹화
 */
export function groupByMonth(items: PriceItem[]): Map<string, PriceItem[]> {
  const map = new Map<string, PriceItem[]>()

  for (const item of items) {
    const key = item.exmn_ym
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(item)
  }

  return map
}
