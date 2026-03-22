import regionStatsRaw from '@market/data/market-stats-by-region.json'
import { Category, GradeGroup, GradeStats, ItemDetail, MonthlyPoint, TrendMeta, VarietyStats } from '@market/types/market'

const _now = new Date()
const CURRENT_YM = `${_now.getFullYear()}${String(_now.getMonth() + 1).padStart(2, '0')}`

// ----------------------------------------------------------------
// 원본 JSON 타입 정의
// ----------------------------------------------------------------
interface ComboStats {
  vrty_cd: string
  vrty_label: string
  grd_cd: string
  grd_label: string
  is_default: boolean
  monthly: MonthlyPoint[]
  latest_price: number
  latest_ym: string
  percentile: number
  cheapness_score: number
}

interface RegionStat {
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  sgg_cd: string
  sgg_nm: string
  se_cd: string
  unit: string
  unit_sz: string
  combos: ComboStats[]
}

const regionStats = regionStatsRaw as RegionStat[]

// ----------------------------------------------------------------
// ctgry_cd → Category 매핑
// ----------------------------------------------------------------
function ctgryToCategory(ctgry_cd: string): Category {
  switch (ctgry_cd) {
    case '100': return 'grain'
    case '200': return 'vegetable'
    case '300': return 'special'
    case '400': return 'fruit'
    case '600': return 'seafood'
    case '800': return 'food'
    default: return 'vegetable'
  }
}

// ----------------------------------------------------------------
// unit 표시 문자열 생성
// unit_sz==="1" → unit 그대로, 아니면 unit_sz+unit
// ----------------------------------------------------------------
function buildUnitDisplay(unit: string, unit_sz: string): string {
  return unit_sz === '1' ? unit : `${unit_sz}${unit}`
}

// ----------------------------------------------------------------
// TrendMeta 생성 (monthly 배열 기반)
// ----------------------------------------------------------------
function buildTrendMeta(monthly: MonthlyPoint[], latestPrice: number): TrendMeta {
  if (monthly.length === 0) {
    return { yearMin: 0, yearMax: 0, yearAvg: 0, yearMinDate: '', yearMaxDate: '', vsYearAvgRate: 0 }
  }
  const avgs = monthly.map((m) => m.avg)
  const yearAvg = Math.round(avgs.reduce((s, v) => s + v, 0) / avgs.length)
  const yearMin = Math.min(...monthly.map((m) => m.low))
  const yearMax = Math.max(...monthly.map((m) => m.high))
  const vsYearAvgRate = yearAvg > 0
    ? Math.round(((latestPrice - yearAvg) / yearAvg) * 1000) / 10
    : 0
  return { yearMin, yearMax, yearAvg, yearMinDate: '', yearMaxDate: '', vsYearAvgRate }
}

// ----------------------------------------------------------------
// 저렴함/비쌈 정보 결정 (percentile + 역대 극값 기반)
// ----------------------------------------------------------------
function getCheapnessInfo(percentile: number, latestPrice: number, yearMin: number, yearMax: number): { label: string, explanation: string } {
  // 역대 극값 체크 (±1% 이내)
  const isAllTimeLowest = yearMin > 0 && Math.abs(latestPrice - yearMin) / yearMin <= 0.01
  const isAllTimeHighest = yearMax > 0 && Math.abs(latestPrice - yearMax) / yearMax <= 0.01

  if (isAllTimeLowest) {
    return {
      label: '역대최저가',
      explanation: '역대 가장 저렴한 가격입니다.'
    }
  }

  if (isAllTimeHighest) {
    return {
      label: '역대최고가',
      explanation: '역대 가장 비싼 가격입니다.'
    }
  }

  // percentile 기반 (0 ~ 1 범위)
  const percentilePct = Math.round(percentile * 100)

  if (percentile < 0.1) {
    return {
      label: '역대최저가 근접',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 역대최저가에 근접한 상태입니다.`
    }
  }

  if (percentile < 0.25) {
    return {
      label: '최저가 구간',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 최저가 구간에 속합니다.`
    }
  }

  if (percentile < 0.5) {
    return {
      label: '저가 상태',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 저가 상태입니다.`
    }
  }

  if (percentile < 0.75) {
    return {
      label: '보통',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 하위 ${percentilePct}% 수준으로, 평균적인 가격입니다.`
    }
  }

  if (percentile < 0.9) {
    const topPct = Math.round((1 - percentile) * 100)
    return {
      label: '높은 가격',
      explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 상위 ${topPct}% 수준으로, 높은 가격 상태입니다.`
    }
  }

  // percentile >= 0.9
  const topPct = Math.round((1 - percentile) * 100)
  return {
    label: '비쌈',
    explanation: `현재 ${latestPrice.toLocaleString()}원은 과거 상위 ${topPct}% 수준으로, 매우 비싼 상태입니다.`
  }
}

// ----------------------------------------------------------------
// 전년 동월 평균가 조회
// ----------------------------------------------------------------
function getYoyPrice(latestYm: string, monthly: MonthlyPoint[]): number | undefined {
  let y = parseInt(latestYm.slice(0, 4))
  let m = parseInt(latestYm.slice(4, 6)) - 12
  while (m <= 0) { m += 12; y-- }
  const yoy_ym = `${y}${String(m).padStart(2, '0')}`
  return monthly.find((p) => p.ym === yoy_ym)?.avg
}

// ----------------------------------------------------------------
// combos → GradeGroup 변환 (combos.length <= 1 → undefined)
// unique grd_cd 또는 unique vrty_label 기준으로 토글 가능 여부 결정
// ----------------------------------------------------------------
function buildGradeGroup(combos: ComboStats[]): GradeGroup | undefined {
  if (combos.length <= 1) return undefined

  // grd_cd별로 그룹화
  const grdMap = new Map<string, ComboStats[]>()
  for (const c of combos) {
    if (!grdMap.has(c.grd_cd)) grdMap.set(c.grd_cd, [])
    grdMap.get(c.grd_cd)!.push(c)
  }

  const uniqueGrdCds = [...grdMap.keys()]
  const grdVariable = uniqueGrdCds.length > 1

  // vrty 가변: unique vrty_label 수 > 1 AND item_nm과 다른 vrty_label 존재하는지
  const uniqueVrtyLabels = [...new Set(combos.map((c) => c.vrty_label))]
  // vrty_label이 다 같으면 vrty 토글 불필요 (단, vrty_label이 여러 개면 토글 필요)
  const vrtyVariable = uniqueVrtyLabels.length > 1

  if (!grdVariable && !vrtyVariable) return undefined

  const grades: GradeStats[] = []

  // default grade: is_default combo가 속한 grd_cd
  const defaultCombo = combos.find((c) => c.is_default) ?? combos[0]

  for (const grd_cd of [...grdMap.keys()].sort()) {
    const grdCombos = grdMap.get(grd_cd)!

    const varieties: VarietyStats[] = []

    if (vrtyVariable) {
      // vrty마다 개별 VarietyStats
      const defaultVrtyCd = grdCombos.find((c) => c.is_default)?.vrty_cd
        ?? grdCombos.reduce((best, c) => c.monthly.length > best.monthly.length ? c : best).vrty_cd

      for (const combo of grdCombos) {
        const monthly = combo.monthly.filter((m) => m.ym !== CURRENT_YM)
        if (monthly.length === 0) continue
        varieties.push({
          vrty_cd: combo.vrty_cd,
          vrty_label: combo.vrty_label,
          is_default: combo.vrty_cd === defaultVrtyCd,
          coverage: combo.monthly.length,
          monthly,
          percentile: combo.percentile,
          latest_price: combo.latest_price,
        })
      }
    } else {
      // vrty 단일: is_default combo 우선, 없으면 coverage 최대 combo 사용
      const defaultCombo = grdCombos.find((c) => c.is_default) ?? grdCombos[0]
      const bestCombo = grdCombos.reduce((best, c) => c.monthly.length > best.monthly.length ? c : best)
      const monthly = bestCombo.monthly.filter((m) => m.ym !== CURRENT_YM)
      if (monthly.length > 0) {
        varieties.push({
          vrty_cd: defaultCombo.vrty_cd,
          vrty_label: '',
          is_default: true,
          coverage: bestCombo.monthly.length,
          monthly,
          percentile: defaultCombo.percentile,
          latest_price: defaultCombo.latest_price,
        })
      }
    }

    if (varieties.length === 0) continue

    grades.push({
      grd_cd,
      grd_label: grdVariable ? grdCombos[0].grd_label : '',
      is_default: grd_cd === defaultCombo.grd_cd,
      varieties,
    })
  }

  const totalCombos = grades.reduce((s, g) => s + g.varieties.length, 0)
  if (totalCombos <= 1) return undefined

  return { grades }
}

// ----------------------------------------------------------------
// RegionStat + defaultCombo → ItemDetail 빌드
// ----------------------------------------------------------------
function buildItemDetail(record: RegionStat, defaultCombo: ComboStats): ItemDetail {
  const monthly = defaultCombo.monthly.filter((m) => m.ym !== CURRENT_YM)
  if (monthly.length === 0) return null as unknown as ItemDetail  // caller가 null 체크

  const latestMonthly = monthly[monthly.length - 1]
  const latestPrice = defaultCombo.latest_price
  const latestYm = defaultCombo.latest_ym

  const unitDisplay = buildUnitDisplay(record.unit, record.unit_sz)
  const trendMeta = buildTrendMeta(monthly, latestPrice)
  const gradeGroup = buildGradeGroup(record.combos)

  // gradeGroup의 default 조합으로 featuredGrdCd/VrtyCd 결정
  const defaultGrade = gradeGroup?.grades.find((g) => g.is_default) ?? gradeGroup?.grades[0]
  const defaultVariety = defaultGrade?.varieties.find((v) => v.is_default) ?? defaultGrade?.varieties[0]

  return {
    id: record.item_cd,
    name: record.item_nm,
    category: ctgryToCategory(record.ctgry_cd),
    unit: unitDisplay,
    kinds: [
      {
        kind: '상',
        retailPrice: latestPrice,
        wholesalePrice: 0,
      },
    ],
    monthly,
    trendMeta,
    martPrices: [],
    tips: [],
    gradeGroup,
    grd_label: defaultGrade?.grd_label,
    vrty_label: defaultVariety?.vrty_label,
    featuredGrdCd: defaultGrade?.grd_cd,
    featuredVrtyCd: defaultVariety?.vrty_cd,
    seCd: record.se_cd as '01' | '02' | undefined,
    yoyPrice: getYoyPrice(latestYm, monthly),
    percentile: defaultCombo.percentile,
    cheapness_label: getCheapnessInfo(defaultCombo.percentile, latestPrice, trendMeta.yearMin, trendMeta.yearMax).label,
    cheapness_explanation: getCheapnessInfo(defaultCombo.percentile, latestPrice, trendMeta.yearMin, trendMeta.yearMax).explanation,
  }
}

// ----------------------------------------------------------------
// ALL_ITEMS 빌드: sgg_cd==='1101'(서울) 기준, 없으면 첫 번째 지역 fallback
// ----------------------------------------------------------------

// item_cd별 서울 or fallback record 선택
const itemRecordMap = new Map<string, RegionStat>()
for (const record of regionStats) {
  const existing = itemRecordMap.get(record.item_cd)
  if (!existing) {
    itemRecordMap.set(record.item_cd, record)
  } else if (existing.sgg_cd !== '1101' && record.sgg_cd === '1101') {
    itemRecordMap.set(record.item_cd, record)
  }
}

const ALL_ITEMS: ItemDetail[] = []

for (const record of itemRecordMap.values()) {
  const defaultCombo = record.combos.find((c) => c.is_default) ?? record.combos[0]
  if (!defaultCombo) continue
  const item = buildItemDetail(record, defaultCombo)
  if (item && item.monthly.length > 0) {
    ALL_ITEMS.push(item)
  }
}

// ctgry_cd → item_cd 순 정렬
ALL_ITEMS.sort((a, b) => {
  const recA = itemRecordMap.get(a.id)
  const recB = itemRecordMap.get(b.id)
  const cdA = recA?.ctgry_cd ?? ''
  const cdB = recB?.ctgry_cd ?? ''
  return cdA.localeCompare(cdB) || a.id.localeCompare(b.id)
})

// ----------------------------------------------------------------
// export 함수
// ----------------------------------------------------------------

/** 전체 품목 */
export function getAllItems(): ItemDetail[] {
  return ALL_ITEMS
}

/** slug(=item_cd)로 단일 품목 조회 (전국 대표 지역 기준) */
export function getItemBySlug(slug: string): ItemDetail | undefined {
  return ALL_ITEMS.find((i) => i.id === slug)
}

/** RegionStat → ItemDetail 변환 */
function regionToItemDetail(record: RegionStat): ItemDetail | null {
  const defaultCombo = record.combos.find((c) => c.is_default) ?? record.combos[0]
  if (!defaultCombo) return null
  const item = buildItemDetail(record, defaultCombo)
  return item && item.monthly.length > 0 ? item : null
}

/** slug + 지역 기반 단일 품목 조회 — 지역 데이터 없으면 전국 대표 기준 fallback */
export function getItemBySlugForRegion(slug: string, sgg_cd: string): ItemDetail | undefined {
  // 해당 지역 record 검색
  const regionRecord = regionStats.find((d) => d.item_cd === slug && d.sgg_cd === sgg_cd)
  if (regionRecord) {
    const item = regionToItemDetail(regionRecord)
    if (item) return item
  }
  // fallback: 전국 대표 기준
  return ALL_ITEMS.find((i) => i.id === slug)
}

// 자주 찾는 품목 (고정 순서)
const POPULAR_IDS = ['111', '211', '231', '245', '411', '415', '226', '225', '214', '223', '232', '151']

/** 자주 찾는 품목 (최대 8개) */
export function getPopularItems(limit = 8): ItemDetail[] {
  return POPULAR_IDS
    .map((id) => ALL_ITEMS.find((i) => i.id === id))
    .filter((i): i is ItemDetail => i !== undefined)
    .slice(0, limit)
}

/** 지역 기반 저렴 품목 (default combo의 percentile 오름차순, cheapness_score 내림차순) */
export function getCheapItemsByRegion(sgg_cd: string, limit = 6): ItemDetail[] {
  const regionRecords = regionStats
    .filter((d) => d.sgg_cd === sgg_cd)
    .map((d) => {
      const defaultCombo = d.combos.find((c) => c.is_default) ?? d.combos[0]
      return { record: d, defaultCombo }
    })
    .filter((x): x is { record: RegionStat; defaultCombo: ComboStats } => !!x.defaultCombo)
    .sort((a, b) =>
      a.defaultCombo.percentile - b.defaultCombo.percentile ||
      b.defaultCombo.cheapness_score - a.defaultCombo.cheapness_score
    )
    .filter(x => x.defaultCombo.percentile < 0.5)
    .slice(0, limit)

  return regionRecords
    .map(({ record }) => regionToItemDetail(record))
    .filter((i): i is ItemDetail => i !== null)
}
