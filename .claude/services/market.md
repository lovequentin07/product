# 농수축산물 시세 서비스 (`/market`)

## 서비스 개요

**경로**: `/market`
**상태**: 프로덕션 (v3 완성)
**시작**: 2026-03-10 / 완성: 2026-03-21

농수축산물 도매가 데이터 기반 지역별 저렴 품목 추천 및 상세 가격 조회 서비스.

---

## v3 저렴 필터 (percentile + cheapness_score)

### 배경

- **v1**: `range_pct < 40 && vs_avg_rate <= 0` — 계절성 미반영
- **v2**: CV 기반 계절/비계절 분류 — 지역 데이터 미반영
- **v3**: 지역별 월별 데이터 기반 런타임 계산 ✅

### 알고리즘

**ComboStats (월별 집계 지표)**:
```typescript
percentile: number        // 과거 월평균 중 현재가 이하인 비율 (0.1 = 역대 10%)
cheapness_score: number   // (전체평균 − 현재가) / 표준편차 (Z-score 역수)
```

**정렬 로직**:
1. percentile 오름차순 (낮을수록 저렴)
2. 동점 시 cheapness_score 내림차순
3. 상위 6개 반환

### 구현 위치

`src/lib/market-data.ts:295-313` — `getCheapItemsByRegion(sgg_cd, limit=6)`

```typescript
// 예: 사용자 지역 서울 강남구 → 그 지역의 저렴한 품목 6개
const cheapItems = getCheapItemsByRegion('11110', 6)
```

### 지역별 데이터

**데이터 소스**: `src/data/market-stats-by-region.json`
- 23개 시·도 모든 지역 포함
- 각 지역별 품목×등급×신선도 조합의 월별 가격 이력
- CF-IPCity 헤더 기반 사용자 위치 자동 감지

**지역 검증** (2026-03-21):
- sgg_cd 일치: 23/23 ✅
- sgg_nm 한글 일치: 23/23 ✅
- CF-IPCity → region.ts 매핑: 35/35 ✅

---

## 페이지 구조

### 홈 (`/market/page.tsx`)

**섹션**:
1. **Hero** — 제목 + 간단한 설명
2. **저렴 카드** — `getCheapItemsByRegion()` → 상위 6개 (사용자 지역 기반)
3. **인기 품목** — 고정 8개 (가로 스크롤)
4. **FAQ** — 마크다운 기반 아코디언

**데이터**: JSON 정적 로드 (API 없음)

### 상세 (`/market/[item]/page.tsx`)

**섹션**:
1. **헤더** — 품목명 + 현재가 + 등급·신선도 토글 (GradeSelector)
2. **차트** — 월별 가격 추이 (Recharts, 12개월)
3. **보관가이드** — 마크다운 (예: "냉장 보관, 5℃ 이하...")
4. **FAQ** — 상세 페이지 전용

---

## 등급·신선도 토글

### 구성

**컴포넌트**: `src/components/market/GradeSelector.tsx`

대부분 품목은 기본 등급(최다 coverage)만 표시. 수산물 일부(갈치, 고등어 등)는 등급 선택 가능.

```typescript
// 예: 고등어는 大/中/小 토글 가능
<GradeSelector
  item_cd="611"
  available_grades={['大', '中', '小']}
  onSelect={(grd_cd) => updateChart(grd_cd)}
/>
```

### 데이터 구조

```json
// market-stats-by-region.json 예시
{
  "611": {  // 고등어 item_cd
    "sgg_nm": "서울",
    "grades": [
      {
        "vrty_cd": "00",
        "grd_cd": "01",
        "grd_nm": "大",
        "monthly": [
          { "ym": "202512", "avg_price": 12500, ... },
          ...
        ]
      },
      {
        "vrty_cd": "00",
        "grd_cd": "02",
        "grd_nm": "中",
        "monthly": [...]
      }
    ]
  }
}
```

---

## 주요 파일

| 파일 경로 | 역할 |
|----------|------|
| `src/app/market/page.tsx` | 홈 페이지 |
| `src/app/market/[item]/page.tsx` | 상세 페이지 + 메타 생성 |
| `src/app/market/[item]/layout.tsx` | 상세 페이지 레이아웃 |
| `src/lib/market-data.ts` | `getCheapItemsByRegion()` 저렴 필터 로직 |
| `src/data/market-stats-by-region.json` | 지역별 월별 가격 데이터 (정적) |
| `src/data/market-mapping.ts` | 품목 메타 (item_cd ↔ slug 매핑) |
| `src/components/market/*` | UI 컴포넌트 (Hero, Chart, GradeSelector 등) |

---

## API 엔드포인트

**없음** — 모든 데이터는 정적 JSON 파일에서 로드.

---

## 성능 및 SEO

- **정적 생성**: 동적 라우트 `[item]`도 빌드 시점에 미리 생성
- **메타 자동 생성**: `generateMetadata()` 각 품목별 og:title, og:description 동적 생성
- **sitemap**: 품목별 URL 포함

---

## 향후 확장

현재는 JSON 정적 기반. 실시간 시세 연동 필요 시:
1. KAMIS API (한국농수산식품유통공사) 연동
2. D1 테이블로 데이터 저장
3. 일일/주간 배치로 D1 갱신
4. API 라우트 추가 가능

---

## 참고

- 브랜치: `feat/market`
- 메모리: `C:\Users\admin\.claude\projects\d--product\memory\market_v3_status.md`
- 작업 추적: `tasks/todo.md` (v3 섹션)
