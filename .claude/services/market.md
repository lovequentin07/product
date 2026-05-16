# 농수축산물 시세 서비스 (`/market`)

## 서비스 개요

**경로**: `/market`
**상태**: 프로덕션 (D1 실시간 연동 완성)

공공데이터포털 농산물 가격 API 기반 지역별 저렴 품목 추천 및 상세 가격 조회 서비스.
평일 매일 오전 10시 KST에 GitHub Actions로 자동 데이터 수집.

---

## v3 저렴 필터 (percentile + cheapness_score)

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

`src/market/lib/market-data.ts` — `getCheapItemsByRegion(sgg_cd, limit=6)`

### 데이터 소스 (실시간 D1 기반)

**Primary**: Cloudflare D1
- `market_monthly_prices`: 월별 가격 이력
- `market_item_stats`: 품목별 사전계산 통계

**Fallback**: `src/market/data/market-stats-by-region.json` (로컬 개발용)

**자동 갱신**:
- GitHub Actions Cron: 평일 매일 오전 10시 KST (`update-market.yml`)
- `npx tsx src/market/scripts/update-market.ts` 자동 실행
- 공공데이터포털 API: `https://apis.data.go.kr/B552845/perYearMonth/price`
- **최근 25개월 데이터 수집** → IQR 이상치 제거 + percentile/cheapness_score 계산 + D1 UPSERT

---

## 페이지 구조

### 홈 (`/market/page.tsx`)

**섹션**:
1. **Hero** — 제목 + 간단한 설명
2. **저렴 카드** — `getCheapItemsByRegion()` → 상위 6개 (카테고리 토글 지원)
3. **FAQ** — 아코디언

### 상세 (`/market/[item]/page.tsx`)

**섹션**:
1. **헤더** — 품목명 + 현재가 + 등급·신선도 토글 (GradeSelector)
2. **차트** — 월별 가격 추이 (Recharts, 12개월)
3. **보관가이드** — 마크다운
4. **FAQ** — 상세 페이지 전용

**주의**: `/market/[item]` URL은 숫자 ID 기반 (`/market/653?grd=05&vrty=00` 형식)

---

## 주요 파일

| 파일 경로 | 역할 |
|----------|------|
| `src/app/market/page.tsx` | 홈 페이지 (Server Component) |
| `src/app/market/[item]/page.tsx` | 상세 페이지 + generateMetadata |
| `src/market/lib/market-data.ts` | 비즈니스 로직 (`getCheapItemsByRegion()` 등) |
| `src/market/lib/db/market.ts` | D1 쿼리 + JSON fallback |
| `src/market/lib/api/public-data-client.ts` | 공공데이터포털 API 클라이언트 |
| `src/market/lib/region.ts` | 지역 코드 유틸 |
| `src/market/scripts/update-market.ts` | D1 갱신 스크립트 (GitHub Actions) |
| `src/market/data/market-stats-by-region.json` | 지역별 월별 가격 (로컬 fallback) |
| `src/market/components/` | UI 컴포넌트 (MarketHero, PriceTrendChart, GradeSelector 등) |
| `src/shared/data/schema.sql` | D1 테이블 정의 (market_*) |
| `.github/workflows/update-market.yml` | 평일 매일 10시 KST 자동 실행 |

---

## SEO

### 구조화 데이터 (JSON-LD / Schema.org)

**홈 페이지** (`/market/page.tsx`):
- **BreadcrumbList**: 홈 > 농수축산물 시세
- **CollectionPage**: 저렴 품목 6개 ItemList (동적 생성)
- **FAQPage**: 4개 FAQ

**상세 페이지** (`/market/[item]/page.tsx`):
- **BreadcrumbList**: 홈 > 농수축산물 시세 > {품목명}
- **Product + AggregateOffer**: 1년 최저/최고가 + 오늘 가격 범위
- **FAQPage**: 4개 동적 FAQ

### sitemap

- `/market`: priority 1.0 (daily)
- `/guide/market-price-guide`, `/guide/market-shopping-guide`: priority 0.7
- 품목별 URL: priority 0.8

---

## 가이드 페이지 (원본 콘텐츠, AdSense 대비)

| 경로 | 내용 |
|------|------|
| `/guide/market-price-guide` | 소매가·등급·percentile·데이터출처·제철 식재료 |
| `/guide/market-shopping-guide` | 장바구니 물가·저렴 품목 찾기·채소/과일/수산물 선택법·보관법 |

**현황**: 페이지 완성, sitemap 등록됨. 홈페이지 네비게이션 링크 미추가 (todo 참고).
