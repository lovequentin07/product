# 서비스: 아파트 실거래가 조회 (`/apt`)

## 개요

서울 아파트 실거래가를 조회·비교하는 핵심 서비스.
- **URL**: `datazip.net/apt`, `datazip.net/apt/{sgg_nm}`, `datazip.net/apt/{sgg_nm}/{apt_nm}`
- **DB 테이블**: `apt_transactions` (구 `transactions`, v4 스키마)

## 데이터 플로우

```
SearchForm (클라이언트)
  → URL 쿼리 파라미터 push
  → src/app/apt/page.tsx (서버 컴포넌트, searchParams 읽기)
  → getTransactions() → src/lib/db/transactions.ts
  → D1 SQL (정렬·필터·페이지네이션 모두 서버사이드)
  → TransactionRow[] → NormalizedTransaction[]
  → TransactionsClientComponent
```

**클라이언트 상태**: `TransactionsClientComponent`가 아파트명 검색(500ms 디바운스), 정렬(URL 기반) 관리 → `TransactionList`(표현 컴포넌트)에 전달.

## URL 파라미터

| 파라미터 | 설명 |
|----------|------|
| `lawdCd` | 법정동 코드 (지역 필터) |
| `dealYmd` | 거래 연월 (YYYYMM) |
| `pageNo` | 페이지 번호 |
| `sortBy` | 정렬 컬럼 |
| `sortDir` | 정렬 방향 (asc/desc) |
| `searchTerm` | 아파트명 검색 |
| `areaMin/Max` | 전용면적 필터 (평) |
| `priceMin/Max` | 거래가 필터 (억) |

아파트 상세 페이지 추가 파라미터: `areaBucket`, `numOfRows`

## D1 데이터베이스

- **DB 이름**: `apt-trade-db`
- **ID**: `a65766e9-f184-4771-bbf6-4139d0f7b6a8`
- **바인딩명**: `DB`
- **행수**: 131만건 (2006~2026, 서울 전체)
- **사전 계산 컬럼**: `deal_amount_billion`, `area_pyeong`, `price_per_pyeong`
- **인덱스**: `idx_transactions_area_pyeong`, `idx_transactions_amount_billion`

## 로컬 개발 (Mock)

- **파일**: `src/lib/db/mock-data.ts`
- **건수**: 17건
- D1 연결 불가 시 자동 폴백

## 핵심 파일

| 역할 | 파일 |
|------|------|
| 목록 페이지 | `src/app/apt/page.tsx` |
| 지역 페이지 | `src/app/apt/[sgg_nm]/page.tsx` |
| 상세 페이지 | `src/app/apt/[sgg_nm]/[apt_nm]/page.tsx` |
| DB 레이어 | `src/lib/db/transactions.ts` |
| DB 레이어 (단지) | `src/lib/db/apt.ts` |
| API 라우트 | `src/app/api/transactions/route.ts` |
| 상세 API | `src/app/api/apt/[sgg_cd]/[apt_nm]/history/route.ts` |
| 클라이언트 컴포넌트 | `src/components/TransactionsClientComponent.tsx` |
| 상세 트랜잭션 | `src/components/apt-detail/AptDetailTransactionsClient.tsx` |

## KV 캐시

- **네임스페이스**: `CACHE` (ID: `0e3ba494ce7648fb95c7b92dfbe0bd06`)
- **TTL**: 86400초 (24시간)
- **캐시 키**: `txn:{sgg_cd}:{deal_ymd}:{sort}:{order}:{page}:{limit}:{area_min}:{area_max}:{price_min}:{price_max}`
- **제외**: `apt_nm` 검색어 있을 때 캐시 미적용

## 스키마 v4 변경사항

- 테이블명: `transactions` → `apt_transactions`
- `apt_meta` 마스터 테이블 추가 (FK: `apt_meta_id`, nullable)
- `apt_name_alias` 테이블 추가
- 마이그레이션 SQL: `src/data/migrate-v4.sql`

## 데이터 스크립트 (`src/scripts/`)

| 스크립트 | 용도 |
|----------|------|
| `fetch-historical.ts` | 원시 데이터 다운로드 |
| `migrate-to-d1.ts` | D1 마이그레이션 |
| `verify-data-integrity.ts` | 데이터 검증 |
| `create-apt-meta.ts` | apt_meta 마스터 테이블 생성 |
