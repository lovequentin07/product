# 마켓 서비스 코드 검증 리포트

**검증 대상**: `/market` 서비스 전체 코드 (기획 vs 구현)
**검증 일시**: 2026-03-25
**상태**: 🔴 **5개 문제 발견** (우선순위순)

---

## 1. ⚠️ **[우선순위 1] 기획 미구현: 인기 품목 섹션 누락**

### 기획 문서 명시 사항
`.claude/services/market.md` 라인 60-64:
```
## 페이지 구조

### 홈 (`/market/page.tsx`)

**섹션**:
1. **Hero** — 제목 + 간단한 설명
2. **저렴 카드** — `getCheapItemsByRegion()` → 상위 6개 (사용자 지역 기반)
3. **인기 품목** — 고정 8개 (가로 스크롤)  ← ⚠️ THIS IS MISSING
4. **FAQ** — 마크다운 기반 아코디언
```

### 현황
- ✅ PopularSection 컴포넌트 구현됨: `src/market/components/PopularSection.tsx`
- ✅ getPopularItems() 함수 구현됨: `src/market/lib/market-data.ts:380-385`
- ❌ **홈페이지 page.tsx에 import/사용 안 됨**

### 검증
```bash
grep -n "PopularSection\|getPopularItems" src/app/market/page.tsx
# → 결과: 없음 (미포함)
```

### 영향도
- **SEO**: 인기 품목 콘텐츠 누락으로 페이지 체류 시간 감소
- **수익성**: 광고 노출 기회 손실 (8개 카드 미표시)
- **기획 일관성**: 명시된 4가지 섹션 중 1개 누락

---

## 2. ⚠️ **[우선순위 2] 효율성: 불필요한 데이터 페칭**

### 현황
```typescript
// src/app/market/page.tsx:24
const cheapItems = getCheapItemsByRegion(sgg_cd, 60)  // ← 60개 요청
```

```typescript
// src/market/components/PriceChangeList.tsx:24
const filtered = (!category || category === 'all')
  ? items.slice(0, 6)  // ← 6개만 표시
  : items.filter(item => item.category === category as Category)
```

### 문제
- **요청**: 60개 물품 데이터 필터링/정렬
- **사용**: 6개만 표시, 54개는 버려짐
- **리소스 낭비**: JSON 파싱, 배열 정렬 불필요 비용

### 수정
```typescript
// src/app/market/page.tsx:24 수정안
const cheapItems = getCheapItemsByRegion(sgg_cd, 6)  // limit=6
```

**영향도**: CPU 시간 감소 (JSON 파싱 54개 데이터 skip)

---

## 3. ⚠️ **[우선순위 3] 로직 불일치: cheapness_label 생성 기준 차이**

### market-data.ts 로직
`src/market/lib/market-data.ts:93-157` — `getCheapnessInfo()`

```typescript
function getCheapnessInfo(percentile: number, latestPrice: number, yearMin: number, yearMax: number): { label: string, explanation: string } {
  // 1️⃣ 역대 극값 체크 (±1% 이내)
  const isAllTimeLowest = yearMin > 0 && Math.abs(latestPrice - yearMin) / yearMin <= 0.01
  const isAllTimeHighest = yearMax > 0 && Math.abs(latestPrice - yearMax) / yearMax <= 0.01

  if (isAllTimeLowest) return { label: '역대최저가', explanation: '...' }
  if (isAllTimeHighest) return { label: '역대최고가', explanation: '...' }

  // 2️⃣ percentile 기반 판단
  if (percentile < 0.1) return { label: '역대최저가 근접', ... }
  // ...
}
```

### GradeSelector 로직
`src/market/components/GradeSelector.tsx:40-87` — `getCheapnessLabel()`

```typescript
function getCheapnessLabel(percentile: number | undefined): string {
  // ❌ 역대 극값 체크 없음 (percentile만 사용)
  if (percentile < 0.1) return '역대최저가 근접'
  if (percentile < 0.25) return '최저가 구간'
  // ...
}
```

### 문제
**동일 품목에서 등급 변경 시 설명이 달라질 수 있음**

예시:
- 홈 카드: "역대최저가" (market-data 기반, 역대 극값 체크 포함)
- 상세 페이지-다른등급: "역대최저가 근접" (GradeSelector 기반, percentile만 사용)

### 원인
- market-data는 `defaultCombo` 기준으로 한 번만 계산 (기획 OK)
- GradeSelector는 토글할 때마다 재계산 (percentile만 사용 가능하므로 타협)

### 수정 방향
두 가지 선택지:
1. **GradeSelector에 yearMin/yearMax 전달** → getCheapnessInfo() 직접 호출
2. **GradeSelector는 percentile만 사용** → market-data와 일관성 명시 문서화

---

## 4. ⚠️ **[우선순위 4] 누락: popularRank 필드 설정 안 됨**

### 현황
```typescript
// src/market/types/market.ts (라인 80)
export interface ItemDetail {
  // ...
  popularRank?: number   // ← 타입 정의됨
  // ...
}
```

```typescript
// src/market/components/PopularSection.tsx (라인 29-32)
{item.popularRank !== undefined && (
  <span className="shrink-0 text-[11px] font-black text-gray-400">
    {item.popularRank}  // ← 항상 undefined (표시 안 됨)
  </span>
)}
```

```typescript
// src/market/lib/market-data.ts (라인 278-304)
return {
  // ... 다른 필드들
  percentile: defaultCombo.percentile,
  cheapness_label: ...,
  cheapness_explanation: ...,
  // ❌ popularRank 설정 안 함
}
```

### 기획 문서와의 관계
기획에서 "자주 찾는 품목"의 순위 표시는 명시 안 되었지만, UI 구현은 있음.

### 영향
PopularSection에서 순위 숫자가 표시되지 않음 (getPopularItems도 미포함이므로 이중 미완성)

---

## 5. ⚠️ **[우선순위 5] 코드 중복: yoyPrice 계산 로직**

### market-data.ts
`src/market/lib/market-data.ts:162-168`
```typescript
function getYoyPrice(latestYm: string, monthly: MonthlyPoint[]): number | undefined {
  let y = parseInt(latestYm.slice(0, 4))
  let m = parseInt(latestYm.slice(4, 6)) - 12
  while (m <= 0) { m += 12; y-- }
  const yoy_ym = `${y}${String(m).padStart(2, '0')}`
  return monthly.find((p) => p.ym === yoy_ym)?.avg ?? undefined
}
```

### GradeSelector
`src/market/components/GradeSelector.tsx:140-148`
```typescript
const yoyPrice = useMemo(() => {
  if (filteredMonthly.length === 0) return undefined
  const lastYm = filteredMonthly[filteredMonthly.length - 1].ym
  let y = parseInt(lastYm.slice(0, 4))
  let m = parseInt(lastYm.slice(4, 6)) - 12
  while (m <= 0) { m += 12; y-- }
  const yoy_ym = `${y}${String(m).padStart(2, '0')}`
  return filteredMonthly.find((p) => p.ym === yoy_ym)?.avg
}, [filteredMonthly])
```

### 문제
- 로직 100% 동일
- 유지보수 어려움 (한쪽만 수정되면 불일치)
- 공유 라이브러리화 필요

---

## 6. ✅ **CSS 변수 실제 사용 여부 (INFO)**

### 현황
```typescript
// src/market/components/PriceTrendChart.tsx (라인 292, 299, 306)
<span style={{ color: 'var(--color-price-high)' }}>▲역대최고가</span>
```

실제 색상 값:
- `--color-price-high` → 실제 사용: `#DC2626` (라인 202)
- `--color-price-current` → 실제 사용: `#2563eb` (라인 87)
- `--color-price-low` → 실제 사용: `#059669` (라인 246)

### 점검 결과
✅ **CSS 변수 사용하고 있지만, 실제로는 하드코딩된 색상과 동일**
- 브라우저가 변수를 찾을 수 없으면 fallback이 필요
- 현재: 변수 미정의 → 색상 미표시 위험

**권장**: CSS 변수 명시적 정의 필요
```css
:root {
  --color-price-high: #DC2626;
  --color-price-current: #2563eb;
  --color-price-low: #059669;
}
```

---

## 요약 테이블

| 우선순위 | 항목 | 상태 | 영향도 | 수정 난이도 |
|---------|------|------|--------|-----------|
| 1 | 인기 품목 섹션 누락 | 🔴 미구현 | 높음 (기획 미완) | 낮음 |
| 2 | 효율성 (limit 60→6) | 🟡 비효율 | 중간 | 낮음 |
| 3 | cheapness 로직 불일치 | 🟡 위험 | 중간 | 중간 |
| 4 | popularRank 미설정 | 🟡 누락 | 낮음 | 낮음 |
| 5 | yoyPrice 로직 중복 | 🟡 기술부채 | 낮음 | 낮음 |
| 6 | CSS 변수 미정의 | 🟡 위험 | 낮음 | 낮음 |

---

## 검증 완료
- **기획 일관성**: 🔴 인기 품목 섹션 미구현 확인
- **코드 품질**: 🟡 중복 로직, 불일치 로직 발견
- **성능**: 🟡 불필요한 데이터 페칭 확인

**다음 단계**: 수정 계획 수립 및 구현
