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

- **정적 생성**: 동적 라우트 `[item]`도 빌드 시점에 미리 생성
- **메타 자동 생성**: `generateMetadata()` 각 품목별 og:title, og:description 동적 생성
- **sitemap**: 품목별 URL 포함

---

## 향후 개선

**현재 구현** (2026-03-27):
✅ 공공데이터포털 API 연동
✅ D1 테이블로 데이터 저장
✅ GitHub Actions 일일 배치 갱신 (평일 10시)
✅ 로컬 JSON fallback 지원

**선택사항**:
1. **Percentile/Cheapness Score 계산**: 현재 NULL → 향후 D1 쿼리에서 실시간 계산
2. **일별 데이터**: 공공데이터는 월별만 제공 (일별 필요 시 별도 API)
3. **지역 정보**: 공공데이터는 "전국(1100)" 기준만 제공
4. **KAMIS API**: 일별 가격이 필요한 경우 추가 연동 가능

---

## 참고

- 브랜치: `feat/market`
- 메모리: `C:\Users\admin\.claude\projects\d--product\memory\market_v3_status.md`
- 작업 추적: `tasks/todo.md` (v3 섹션)
