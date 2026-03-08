import { ItemDetail, PricePoint, TrendMeta, MartPrice, Mart, getDefaultKind } from '@/types/market'

// 1년치 추세 데이터 생성
function generateTrend(baseWholesale: number, retailMult: number, days = 365): PricePoint[] {
  const result: PricePoint[] = []
  const today = new Date(2026, 2, 6)
  let ws = baseWholesale * 1.05
  for (let i = days; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // 계절성 반영: 봄(3~5월) 하락, 가을(9~11월) 상승
    const month = d.getMonth()
    const seasonalBias = (month >= 2 && month <= 4) ? -0.53 : (month >= 8 && month <= 10) ? -0.51 : -0.52
    ws = ws + (Math.random() + seasonalBias) * baseWholesale * 0.025
    ws = Math.max(baseWholesale * 0.6, Math.min(baseWholesale * 1.5, ws))
    const w = Math.round(ws / 10) * 10
    result.push({
      date: d.toISOString().slice(0, 10),
      wholesale: w,
      retail: Math.round((w * retailMult) / 10) * 10,
    })
  }
  return result
}

function computeTrendMeta(trend: PricePoint[], currentRetail: number): TrendMeta {
  const retails = trend.map((p) => p.retail)
  const yearMin = Math.min(...retails)
  const yearMax = Math.max(...retails)
  const yearAvg = Math.round(retails.reduce((a, b) => a + b, 0) / retails.length)
  const yearMinDate = trend[retails.indexOf(yearMin)].date
  const yearMaxDate = trend[retails.indexOf(yearMax)].date
  const vsYearAvgRate = Math.round(((currentRetail - yearAvg) / yearAvg) * 1000) / 10
  return { yearMin, yearMax, yearAvg, yearMinDate, yearMaxDate, vsYearAvgRate }
}

function makeDayChange(retailPrice: number, rate: number) {
  const amount = Math.round(retailPrice * (rate / 100))
  return { amount, rate, basePrice: retailPrice - amount }
}

function makeWeekChange(retailPrice: number, rate: number) {
  const amount = Math.round(retailPrice * (rate / 100))
  return { amount, rate, basePrice: retailPrice - amount }
}

function computeMartPrices(prices: Partial<Record<Mart, number>>): MartPrice[] {
  const entries = Object.entries(prices) as [Mart, number][]
  const validPrices = entries.map(([, p]) => p).filter(Boolean)
  const minPrice = Math.min(...validPrices)
  return entries.map(([mart, price]) => ({
    mart,
    price,
    isLowest: price === minPrice,
  }))
}

// 추세 데이터 (아이템별 미리 생성)
const carrotTrend = generateTrend(3420, 1.49)
const onionTrend = generateTrend(1950, 1.53)
const cabbageTrend = generateTrend(4100, 1.44)
const potatoTrend = generateTrend(2800, 1.39)
const garlicTrend = generateTrend(8500, 1.51)
const appleTrend = generateTrend(7200, 1.36)
const strawberryTrend = generateTrend(12500, 1.42)
const mackerelTrend = generateTrend(3200, 1.38)
const squidTrend = generateTrend(4800, 1.44)
const porkTrend = generateTrend(2650, 1.31)

export const MOCK_ITEMS: ItemDetail[] = [
  {
    id: 'carrot',
    name: '당근',
    category: 'vegetable',
    unit: 'kg',
    popularRank: 3,
    tips: [
      '10월~3월이 제철, 겨울 당근이 달고 영양 풍부',
      '잎 제거 후 신문지에 싸서 냉장 보관',
      '표면이 매끄럽고 균일한 주황색인 것을 선택',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 3420, retailPrice: 5100, dayChange: makeDayChange(5100, -12.0), weekChange: makeWeekChange(5100, -15.5) },
      { kind: '특', wholesalePrice: 4800, retailPrice: 7200, dayChange: makeDayChange(7200, -10.5), weekChange: makeWeekChange(7200, -14.0) },
      { kind: '상', wholesalePrice: 3900, retailPrice: 5800, dayChange: makeDayChange(5800, -12.0), weekChange: makeWeekChange(5800, -15.5) },
      { kind: '중', wholesalePrice: 3200, retailPrice: 4800, dayChange: makeDayChange(4800, -12.5), weekChange: makeWeekChange(4800, -16.0) },
      { kind: '하', wholesalePrice: 2600, retailPrice: 3900, dayChange: makeDayChange(3900, -13.0), weekChange: makeWeekChange(3900, -17.0) },
      { kind: '수입', wholesalePrice: 2400, retailPrice: 3600, dayChange: makeDayChange(3600, -8.0), weekChange: makeWeekChange(3600, -10.5) },
    ],
    martPrices: computeMartPrices({ coupang: 4500, emart: 4980, homeplus: 5100, lotte: 5290 }),
    trend: carrotTrend,
    trendMeta: { ...computeTrendMeta(carrotTrend, 5100), vsYearAvgRate: -12.5, yearMin: 3500, yearMax: 18000 },
  },
  {
    id: 'onion',
    name: '양파',
    category: 'vegetable',
    unit: 'kg',
    popularRank: 5,
    tips: [
      '망에 넣어 통풍이 잘 되는 서늘한 곳에 보관',
      '껍질이 잘 마르고 단단하게 여문 것이 좋음',
      '잘라 쓰고 남은 것은 랩으로 싸서 냉장',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 1950, retailPrice: 2980, dayChange: makeDayChange(2980, -6.2), weekChange: makeWeekChange(2980, -9.8) },
      { kind: '특', wholesalePrice: 2700, retailPrice: 4100, dayChange: makeDayChange(4100, -5.5), weekChange: makeWeekChange(4100, -9.0) },
      { kind: '상', wholesalePrice: 2200, retailPrice: 3300, dayChange: makeDayChange(3300, -6.5), weekChange: makeWeekChange(3300, -10.0) },
      { kind: '중', wholesalePrice: 1800, retailPrice: 2700, dayChange: makeDayChange(2700, -7.0), weekChange: makeWeekChange(2700, -10.5) },
      { kind: '하', wholesalePrice: 1400, retailPrice: 2100, dayChange: makeDayChange(2100, -8.0), weekChange: makeWeekChange(2100, -12.0) },
      { kind: '수입', wholesalePrice: 1300, retailPrice: 1950, dayChange: makeDayChange(1950, -4.0), weekChange: makeWeekChange(1950, -6.5) },
    ],
    martPrices: computeMartPrices({ coupang: 2500, emart: 2780, homeplus: 2980, lotte: 3100 }),
    trend: onionTrend,
    trendMeta: { ...computeTrendMeta(onionTrend, 2980), vsYearAvgRate: -6.8, yearMin: 2000, yearMax: 11000 },
  },
  {
    id: 'cabbage',
    name: '배추',
    category: 'vegetable',
    unit: '포기',
    popularRank: 6,
    tips: [
      '겉잎 제거 없이 신문지로 싸서 냉장 보관',
      '속이 꽉 차고 들었을 때 묵직한 것이 신선',
      '11월~2월 김장 배추가 달고 품질이 좋음',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 4100, retailPrice: 5900, dayChange: makeDayChange(5900, -9.3), weekChange: makeWeekChange(5900, -12.1) },
      { kind: '특', wholesalePrice: 6000, retailPrice: 8700, dayChange: makeDayChange(8700, -8.0), weekChange: makeWeekChange(8700, -11.0) },
      { kind: '상', wholesalePrice: 4800, retailPrice: 6900, dayChange: makeDayChange(6900, -9.5), weekChange: makeWeekChange(6900, -12.5) },
      { kind: '중', wholesalePrice: 3800, retailPrice: 5500, dayChange: makeDayChange(5500, -10.0), weekChange: makeWeekChange(5500, -13.0) },
      { kind: '하', wholesalePrice: 2900, retailPrice: 4200, dayChange: makeDayChange(4200, -11.0), weekChange: makeWeekChange(4200, -14.0) },
    ],
    martPrices: computeMartPrices({ emart: 4980, coupang: 5200, homeplus: 5500, lotte: 5890 }),
    trend: cabbageTrend,
    trendMeta: { ...computeTrendMeta(cabbageTrend, 5900), vsYearAvgRate: -9.1, yearMin: 4000, yearMax: 22000 },
  },
  {
    id: 'potato',
    name: '감자',
    category: 'vegetable',
    unit: 'kg',
    tips: [
      '햇빛을 피해 서늘하고 어두운 곳에 보관',
      '싹이 난 감자는 싹 주변을 넉넉히 잘라냄',
      '5~6월 수확 햇감자가 수분 많고 부드러움',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 2800, retailPrice: 3900, dayChange: makeDayChange(3900, 3.7), weekChange: makeWeekChange(3900, 5.2) },
      { kind: '특', wholesalePrice: 3900, retailPrice: 5500, dayChange: makeDayChange(5500, 3.5), weekChange: makeWeekChange(5500, 5.0) },
      { kind: '상', wholesalePrice: 3200, retailPrice: 4500, dayChange: makeDayChange(4500, 4.0), weekChange: makeWeekChange(4500, 5.5) },
      { kind: '중', wholesalePrice: 2600, retailPrice: 3600, dayChange: makeDayChange(3600, 4.0), weekChange: makeWeekChange(3600, 5.5) },
      { kind: '하', wholesalePrice: 2000, retailPrice: 2800, dayChange: makeDayChange(2800, 3.0), weekChange: makeWeekChange(2800, 4.5) },
      { kind: '수입', wholesalePrice: 1900, retailPrice: 2700, dayChange: makeDayChange(2700, 2.0), weekChange: makeWeekChange(2700, 3.5) },
    ],
    martPrices: computeMartPrices({ coupang: 3500, emart: 3780, homeplus: 3900, lotte: 4100 }),
    trend: potatoTrend,
    trendMeta: { ...computeTrendMeta(potatoTrend, 3900), vsYearAvgRate: 3.7, yearMin: 3500, yearMax: 6000 },
  },
  {
    id: 'garlic',
    name: '마늘',
    category: 'vegetable',
    unit: 'kg',
    tips: [
      '망에 담아 통풍 좋은 그늘에 보관, 냉동도 가능',
      '깐 마늘은 밀폐용기에 냉장 1주일 이내 사용',
      '6월 남도 마늘이 가장 알차고 향이 강함',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 8500, retailPrice: 12800, dayChange: makeDayChange(12800, -4.5), weekChange: makeWeekChange(12800, -7.3) },
      { kind: '특', wholesalePrice: 12000, retailPrice: 18000, dayChange: makeDayChange(18000, -3.5), weekChange: makeWeekChange(18000, -6.5) },
      { kind: '상', wholesalePrice: 9800, retailPrice: 14700, dayChange: makeDayChange(14700, -4.5), weekChange: makeWeekChange(14700, -7.5) },
      { kind: '중', wholesalePrice: 7500, retailPrice: 11300, dayChange: makeDayChange(11300, -5.0), weekChange: makeWeekChange(11300, -8.0) },
      { kind: '수입', wholesalePrice: 5500, retailPrice: 8200, dayChange: makeDayChange(8200, -3.0), weekChange: makeWeekChange(8200, -5.5) },
    ],
    martPrices: computeMartPrices({ emart: 11980, homeplus: 12800, lotte: 13200, coupang: 12500 }),
    trend: garlicTrend,
    trendMeta: { ...computeTrendMeta(garlicTrend, 12800), vsYearAvgRate: -5.2, yearMin: 9000, yearMax: 48000 },
  },
  {
    id: 'apple',
    name: '사과',
    category: 'fruit',
    unit: 'kg',
    popularRank: 1,
    tips: [
      '10~11월 후지 사과가 가장 달고 바삭함',
      '냉장 시 에틸렌 가스 때문에 다른 채소와 분리',
      '껍질에 왁스 코팅된 경우 소금으로 문질러 씻기',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 7200, retailPrice: 9800, dayChange: makeDayChange(9800, 5.1), weekChange: makeWeekChange(9800, 8.2) },
      { kind: '특', wholesalePrice: 10500, retailPrice: 14300, dayChange: makeDayChange(14300, 4.5), weekChange: makeWeekChange(14300, 7.5) },
      { kind: '상', wholesalePrice: 8200, retailPrice: 11100, dayChange: makeDayChange(11100, 5.0), weekChange: makeWeekChange(11100, 8.0) },
      { kind: '중', wholesalePrice: 6500, retailPrice: 8800, dayChange: makeDayChange(8800, 5.5), weekChange: makeWeekChange(8800, 8.5) },
      { kind: '하', wholesalePrice: 4800, retailPrice: 6500, dayChange: makeDayChange(6500, 6.0), weekChange: makeWeekChange(6500, 9.0) },
    ],
    martPrices: computeMartPrices({ emart: 8900, coupang: 9200, homeplus: 9500, lotte: 9800 }),
    trend: appleTrend,
    trendMeta: { ...computeTrendMeta(appleTrend, 9800), vsYearAvgRate: 5.1, yearMin: 7000, yearMax: 13500 },
  },
  {
    id: 'strawberry',
    name: '딸기',
    category: 'fruit',
    unit: 'kg',
    popularRank: 4,
    tips: [
      '12월~3월이 제철, 지금이 가장 달고 저렴한 시기',
      '꼭지가 신선하고 진한 붉은색이 고른 것 선택',
      '씻지 않은 상태로 냉장, 먹기 직전 씻기',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 12500, retailPrice: 17800, dayChange: makeDayChange(17800, -7.8), weekChange: makeWeekChange(17800, -11.2) },
      { kind: '특', wholesalePrice: 18000, retailPrice: 25700, dayChange: makeDayChange(25700, -7.0), weekChange: makeWeekChange(25700, -10.5) },
      { kind: '상', wholesalePrice: 14000, retailPrice: 20000, dayChange: makeDayChange(20000, -7.5), weekChange: makeWeekChange(20000, -11.0) },
      { kind: '중', wholesalePrice: 10500, retailPrice: 15000, dayChange: makeDayChange(15000, -8.5), weekChange: makeWeekChange(15000, -12.0) },
    ],
    martPrices: computeMartPrices({ emart: 16900, coupang: 17200, homeplus: 17800, lotte: 18500 }),
    trend: strawberryTrend,
    trendMeta: { ...computeTrendMeta(strawberryTrend, 17800), vsYearAvgRate: -8.3, yearMin: 12000, yearMax: 55000 },
  },
  {
    id: 'mackerel',
    name: '고등어',
    category: 'seafood',
    unit: '마리',
    popularRank: 2,
    tips: [
      '9~11월이 제철, 기름기가 올라 가장 맛있음',
      '눈이 맑고 아가미가 선명한 붉은색이 신선',
      '내장 제거 후 소금 뿌려 냉동 보관 가능',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 3200, retailPrice: 4400, dayChange: makeDayChange(4400, 2.3), weekChange: makeWeekChange(4400, 4.1) },
      { kind: '특', wholesalePrice: 4500, retailPrice: 6200, dayChange: makeDayChange(6200, 2.0), weekChange: makeWeekChange(6200, 3.8) },
      { kind: '상', wholesalePrice: 3600, retailPrice: 5000, dayChange: makeDayChange(5000, 2.3), weekChange: makeWeekChange(5000, 4.1) },
      { kind: '중', wholesalePrice: 2700, retailPrice: 3700, dayChange: makeDayChange(3700, 2.5), weekChange: makeWeekChange(3700, 4.3) },
      { kind: '수입', wholesalePrice: 2200, retailPrice: 3100, dayChange: makeDayChange(3100, 1.8), weekChange: makeWeekChange(3100, 3.2) },
    ],
    martPrices: computeMartPrices({ coupang: 3990, emart: 4200, homeplus: 4400, lotte: 4600 }),
    trend: mackerelTrend,
    trendMeta: { ...computeTrendMeta(mackerelTrend, 4400), vsYearAvgRate: 2.3, yearMin: 3500, yearMax: 6500 },
  },
  {
    id: 'squid',
    name: '오징어',
    category: 'seafood',
    unit: '마리',
    tips: [
      '4~6월, 10~12월이 제철로 살이 통통',
      '몸통이 투명하고 광택 있는 것이 신선',
      '내장 제거 후 냉동 보관, 3개월 이내 소비',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 4800, retailPrice: 6900, dayChange: makeDayChange(6900, -5.0), weekChange: makeWeekChange(6900, -8.3) },
      { kind: '특', wholesalePrice: 6800, retailPrice: 9800, dayChange: makeDayChange(9800, -4.5), weekChange: makeWeekChange(9800, -7.5) },
      { kind: '상', wholesalePrice: 5500, retailPrice: 7900, dayChange: makeDayChange(7900, -5.0), weekChange: makeWeekChange(7900, -8.5) },
      { kind: '중', wholesalePrice: 4200, retailPrice: 6000, dayChange: makeDayChange(6000, -5.5), weekChange: makeWeekChange(6000, -9.0) },
      { kind: '수입', wholesalePrice: 3500, retailPrice: 5000, dayChange: makeDayChange(5000, -3.0), weekChange: makeWeekChange(5000, -5.5) },
    ],
    martPrices: computeMartPrices({ coupang: 6200, emart: 6500, homeplus: 6900, lotte: 7100 }),
    trend: squidTrend,
    trendMeta: { ...computeTrendMeta(squidTrend, 6900), vsYearAvgRate: -5.0, yearMin: 4500, yearMax: 26000 },
  },
  {
    id: 'pork-belly',
    name: '삼겹살',
    category: 'meat',
    unit: '100g',
    popularRank: 2,
    tips: [
      '붉은 살과 하얀 지방층이 층층이 된 것이 좋음',
      '냉장 구매 후 3일 이내 소비, 장기 보관 시 냉동',
      '해동은 냉장실에서 천천히, 재냉동 금지',
    ],
    kinds: [
      { kind: '전체', wholesalePrice: 2650, retailPrice: 3480, dayChange: makeDayChange(3480, 1.9), weekChange: makeWeekChange(3480, 3.1) },
      { kind: '특', wholesalePrice: 3800, retailPrice: 4990, dayChange: makeDayChange(4990, 1.5), weekChange: makeWeekChange(4990, 2.8) },
      { kind: '상', wholesalePrice: 3100, retailPrice: 4070, dayChange: makeDayChange(4070, 2.0), weekChange: makeWeekChange(4070, 3.2) },
      { kind: '중', wholesalePrice: 2500, retailPrice: 3280, dayChange: makeDayChange(3280, 2.0), weekChange: makeWeekChange(3280, 3.1) },
      { kind: '하', wholesalePrice: 1900, retailPrice: 2500, dayChange: makeDayChange(2500, 1.5), weekChange: makeWeekChange(2500, 2.5) },
      { kind: '수입', wholesalePrice: 1700, retailPrice: 2230, dayChange: makeDayChange(2230, 1.5), weekChange: makeWeekChange(2230, 2.5) },
    ],
    martPrices: computeMartPrices({ coupang: 3100, emart: 3280, homeplus: 3480, lotte: 3590 }),
    trend: porkTrend,
    trendMeta: { ...computeTrendMeta(porkTrend, 3480), vsYearAvgRate: 1.9, yearMin: 3000, yearMax: 5000 },
  },
]

export function getMockItem(id: string): ItemDetail | undefined {
  return MOCK_ITEMS.find((item) => item.id === id)
}

export function getDropItems(): ItemDetail[] {
  return [...MOCK_ITEMS]
    .filter((i) => {
      const { yearMin, yearMax } = i.trendMeta
      const price = getDefaultKind(i).retailPrice
      const range = yearMax - yearMin
      if (range === 0) return false
      return (price - yearMin) / range < 0.30
    })
    .sort((a, b) => {
      const posA = (getDefaultKind(a).retailPrice - a.trendMeta.yearMin) / (a.trendMeta.yearMax - a.trendMeta.yearMin)
      const posB = (getDefaultKind(b).retailPrice - b.trendMeta.yearMin) / (b.trendMeta.yearMax - b.trendMeta.yearMin)
      return posA - posB
    })
}

export function getPopularItems(): ItemDetail[] {
  return MOCK_ITEMS.filter((i) => i.popularRank !== undefined).sort(
    (a, b) => (a.popularRank ?? 99) - (b.popularRank ?? 99)
  )
}

export const MARCH_SEASONAL_IDS = ['strawberry', 'cabbage', 'onion']
