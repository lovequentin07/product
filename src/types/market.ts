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

// 추세 데이터 포인트
export interface PricePoint {
  date: string
  wholesale: number
  retail: number
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
  monthly: { ym: string; high: number; low: number; avg: number }[]
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
  trend: PricePoint[]    // 최근 1년
  trendMeta: TrendMeta
  popularRank?: number
  tips: string[]
  gradeGroup?: GradeGroup  // 크기 토글 대상 품목 (大/中/小)
  grd_label?: string       // 기본 등급 라벨 (daily is_default 기준)
  vrty_label?: string      // 기본 신선도 라벨 (daily is_default 기준)
}

// '상' 등급 우선 선택 helper (없으면 kinds[1] → kinds[0] 순서)
export function getDefaultKind(item: ItemDetail): PriceByKind {
  return item.kinds.find((k) => k.kind === '상') ?? item.kinds[1] ?? item.kinds[0]
}
