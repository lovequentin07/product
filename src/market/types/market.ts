export type Category = 'vegetable' | 'fruit' | 'seafood' | 'grain' | 'food' | 'special'
export type ItemKind = '전체' | '특' | '상' | '중' | '하' | '수입'
export type Mart = 'coupang' | 'emart' | 'homeplus' | 'lotte'

// 가격 변동 (전일/전주)
export interface PriceChange {
  amount: number    // 원 (음수=하락)
  rate: number      // % (음수=하락)
  basePrice: number // 기준가 (어제/지난주 소매가)
}

// 등급별 가격
export interface PriceByKind {
  kind: ItemKind
  wholesalePrice: number
  retailPrice: number
  dayChange?: PriceChange   // 전일 대비 (optional)
  weekChange?: PriceChange  // 전주 대비 (optional)
}

// 마트별 소매가
export interface MartPrice {
  mart: Mart
  price: number | null     // null = 정보 없음
  isLowest: boolean
}

// 월별 가격 포인트 (차트 데이터)
export interface MonthlyPoint {
  ym: string   // "YYYYMM"
  high: number | null   // 월별 집계 없는 달은 null
  low: number | null
  avg: number | null    // latest_ym 달에는 null (라인 끊김)
}

// 일별 가격 포인트
export interface DailyPriceRow {
  ymd: string  // "YYYYMMDD"
  high: number | null
  low: number | null
  avg: number | null
}

// 월별 가격 포인트 (DB 조회용)
export interface MonthlyPriceRow {
  ym: string
  high: number | null
  low: number | null
  avg: number | null
}

// DB에서 조회한 품목 통계 (사전계산)
export interface MarketItemStats {
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  sgg_cd: string
  sgg_nm: string
  se_cd: string | null
  unit: string
  unit_sz: string
  grd_cd: string
  grd_label: string | null
  vrty_cd: string
  vrty_label: string | null
  is_default: number
  latest_price: number | null
  latest_ym: string | null  // YYYYMMDD
  percentile: number | null  // 0~1
  cheapness_score: number | null
}

// 추세 요약 (지금 싼지/비싼지 판단 근거)
export interface TrendMeta {
  yearMin: number
  yearMax: number
  yearAvg: number
  yearMinDate: string
  yearMaxDate: string
  vsYearAvgRate: number // 현재가 vs 연평균 (음수=평균보다 쌈)
}

// ----------------------------------------------------------------
// 등급 토글 (수산물 大/中/小 + 신선/냉동/염장)
// ----------------------------------------------------------------
export interface VarietyStats {
  vrty_cd: string
  vrty_label: string     // "신선", "냉동", "염장"
  is_default: boolean
  coverage: number
  monthly: MonthlyPoint[]
  percentile?: number    // 저렴함 지표
  latest_price: number   // 최신 가격 (필수)
}

export interface GradeStats {
  grd_cd: string
  grd_label: string      // "대", "중", "소"
  is_default: boolean
  varieties: VarietyStats[]   // 1개면 신선도 토글 미표시
}

export interface GradeGroup {
  grades: GradeStats[]
}

// 상세 페이지 전체 타입
export interface ItemDetail {
  id: string
  name: string
  category: Category
  unit: string
  kinds: PriceByKind[]   // kinds[0] = '전체' (기본)
  martPrices: MartPrice[]
  monthly: MonthlyPoint[]
  trendMeta: TrendMeta
  tips: string[]
  gradeGroup?: GradeGroup  // 크기 토글 대상 품목 (大/中/小)
  grd_label?: string       // 기본 등급 라벨
  vrty_label?: string      // 기본 신선도 라벨
  featuredGrdCd?: string   // 기본 등급 코드 (GradeSelector 초기값)
  featuredVrtyCd?: string  // 기본 신선도 코드 (GradeSelector 초기값)
  seCd?: '01' | '02'       // '01'=소매가, '02'=도매가
  percentile: number       // 역대 가격 중 현재가 이하인 비율 (0~1)
  cheapness_label: string  // 가격 상태 라벨
  cheapness_explanation: string  // 가격 상태 설명
}

// '상' 등급 우선 선택 helper (없으면 kinds[1] → kinds[0] 순서)
export function getDefaultKind(item: ItemDetail): PriceByKind {
  return item.kinds.find((k) => k.kind === '상') ?? item.kinds[1] ?? item.kinds[0]
}
