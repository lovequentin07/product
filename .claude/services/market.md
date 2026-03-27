# 농수축산물 시세 서비스 (`/market`)

## 서비스 개요

**경로**: `/market`
**상태**: 프로덕션 (D1 실시간 연동 완성)
**시작**: 2026-03-10 / v3 완성: 2026-03-21 / D1 연동: 2026-03-27

공공데이터포털 농산물 가격 API 기반 지역별 저렴 품목 추천 및 상세 가격 조회 서비스.
평일 매일 오전 10시 KST에 GitHub Actions로 자동 데이터 수집.

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

### 데이터 소스 (실시간 D1 기반)

**Primary**: Cloudflare D1
- `market_monthly_prices`: 월별 가격 이력 (2,059건)
- `market_item_stats`: 품목별 사전계산 통계 (210건)

**Fallback**: `src/data/market-stats-by-region.json` (로컬 개발용)
- 23개 시·도 모든 지역 포함
- 각 지역별 품목×등급×신선도 조합의 월별 가격 이력

**자동 갱신**:
- GitHub Actions Cron: 평일 매일 오전 10시 KST (UTC 01:00)
- `npx tsx src/market/scripts/update-market.ts` 자동 실행
- 공공데이터포털 API: `https://apis.data.go.kr/B552845/perYearMonth/price`
- 지난 13개월 데이터 수집 → D1 UPSERT (용량 일정 유지)

**지역 코드**: 전국(1100) 기준 (공공데이터 API 지역 미포함)

---

## 페이지 구조

### 홈 (`/market/page.tsx`)

**섹션**:
1. **Hero** — 제목 + 간단한 설명
2. **저렴 카드** — `await getCheapItemsByRegion()` → 상위 6개 (사용자 지역 기반, 카테고리 토글 지원)
3. **FAQ** — 마크다운 기반 아코디언

**데이터 로드**:
- Primary: D1 쿼리 (`market_item_stats` 기반)
- Fallback: JSON mock (로컬 개발, D1 없을 때)

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
| `src/app/market/page.tsx` | 홈 페이지 (async Server Component) |
| `src/app/market/[item]/page.tsx` | 상세 페이지 + 메타 생성 (async) |
| `src/app/market/[item]/layout.tsx` | 상세 페이지 레이아웃 |
| `src/market/lib/market-data.ts` | async 함수: `getCheapItemsByRegion()`, `getItemBySlugForRegion()` 등 |
| `src/market/lib/db/market.ts` | D1 쿼리 함수 + JSON mock fallback |
| `src/market/lib/api/public-data-client.ts` | 공공데이터포털 API 클라이언트 |
| `src/market/scripts/update-market.ts` | D1 갱신 스크립트 (GitHub Actions 실행) |
| `.github/workflows/update-market.yml` | 평일 매일 10시 KST 자동 실행 |
| `src/shared/data/schema.sql` | D1 테이블 정의 (market_*) |
| `src/data/market-stats-by-region.json` | 지역별 월별 가격 데이터 (로컬 fallback) |
| `src/data/market-mapping.ts` | 품목 메타 (item_cd ↔ slug 매핑) |
| `src/components/market/*` | UI 컴포넌트 (Hero, Chart, GradeSelector 등) |

---

## 백엔드 시스템

**API 호출**:
- 공공데이터포털: `https://apis.data.go.kr/B552845/perYearMonth/price`
  - 인증: `DATA_GO_KR_API_KEY` (환경변수)
  - 호출 간격: 200ms (rate limiting)

**수집 스크립트**:
- 파일: `src/market/scripts/update-market.ts`
- 실행: GitHub Actions (평일 매일 10시) + 수동 트리거 가능
- 처리: 54,462건 수집 → 38,972건 소매가 필터 → D1 UPSERT

**데이터 계층**:
- `src/market/lib/db/market.ts` — D1 쿼리 함수 + JSON fallback
- `src/market/lib/market-data.ts` — 비즈니스 로직 (async 함수)

---

## 성능 및 SEO

### 구조화 데이터 (JSON-LD / Schema.org)

**홈 페이지** (`/market/page.tsx`):
- **BreadcrumbList**: 홈 > 농수축산물 시세
- **CollectionPage**: 저렴 품목 6개 ItemList (동적 생성)
- **FAQPage**: 4개 FAQ (데이터 업데이트, percentile 설명, 소매가·도매가, 등급 정의)

**상세 페이지** (`/market/[item]/page.tsx`):
- **BreadcrumbList**: 홈 > 농수축산물 시세 > {품목명}
- **Product + AggregateOffer**: 1년 최저/최고가 + 오늘 가격 범위
- **FAQPage**: 4개 동적 FAQ (데이터출처, 현재가격수준, percentile, 소매가정의)

**메인 홈 페이지** (`/page.tsx`):
- **WebSite**: 검색 기능 스키마
- 저렴 품목 Top 6 실시간 표시 (D1 쿼리)

**메타데이터**:
- `generateMetadata()` 각 품목별 동적 title/description
- OpenGraph: og:title, og:description, og:url
- Canonical: 중복 콘텐츠 방지

**기타**:
- **정적 생성**: 동적 라우트 `[item]`도 빌드 시점에 미리 생성
- **sitemap**: `/market` (priority 1.0) + 품목별 URL (priority 0.8)
- **AdSense 준비**: 원본 콘텐츠 추가 (신규 가이드 페이지 진행 중)

---

## 진행 상황 (AdSense 재승인 준비)

### 완료 (2026-03-27, 100%)

**SEO 구조화 (Steps 1-4)**: ✅
- `layout.tsx`: 농산물 중심 메타데이터 + 검색 키워드 재구성
- `page.tsx`: 홈페이지 재설계 (저렴 품목 Top 6 실시간 노출, 아파트 서비스 하단 이동)
- `market/page.tsx`: BreadcrumbList + CollectionPage + FAQPage JSON-LD
- `market/[item]/page.tsx`: BreadcrumbList + AggregateOffer + FAQPage JSON-LD

**데이터 시스템**: ✅
- 공공데이터포털 API 연동 (2,059건 수집)
- D1 자동 갱신 (평일 매일 10시 KST)
- 로컬 JSON fallback (오프라인 개발 지원)

**원본 콘텐츠 (Steps 5-7)**: ✅
- Step 5: `/guide/market-price-guide` 신규 생성 (241줄, Article + BreadcrumbList)
  - 섹션: 소매가, 등급(상/중/하), percentile, 데이터 출처, 제철 식재료 팁
- Step 6: `/guide/market-shopping-guide` 신규 생성 (309줄, Article + BreadcrumbList + FAQPage)
  - 섹션: 장바구니 물가, 저렴 품목 찾기, 채소·과일·수산물 선택법, 보관법
  - FAQ: 4개 항목 (장바구니 물가, 저렴 품목 찾기, 선택 기준, 보관법)
- Step 7: sitemap.ts 업데이트
  - /market: priority 1.0 (daily)
  - /guide/market-*: priority 0.7
  - /apt: 0.8 → 0.5 (하향)
  - regionUrls: 0.7 → 0.5 (하향)

### 선택사항 (향후)

1. **Percentile/Cheapness Score 실시간 계산**: 현재 NULL → D1에서 동적 계산
2. **일별 가격 데이터**: 공공데이터는 월별만 제공 (KAMIS API 필요 시 추가)
3. **지역별 데이터**: 공공데이터는 "전국(1100)" 기준 (세부 지역 필요 시 별도 수집)

---

## 참고

- 메모리 (SEO):
  - `market_seo_restructuring_steps123.md` — Steps 1-4 진행 상황 (2026-03-27)
  - `market_d1_realtime_2026_03_27.md` — D1 실시간 연동 완성
- 메모리 (아키텍처): `market_v3_status.md`
- 작업 추적: `tasks/todo.md`
- 계획: `ancient-brewing-tide.md` (SEO 재구성 계획)
