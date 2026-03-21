# 농수축산물 시세 서비스 (`/market`) — 2026-03-10 기준

## 브랜치: `feat/market`

## 완료 (프론트)

- [x] `src/types/market.ts` — Category, PriceChange, PriceByKind, PricePoint, TrendMeta, ItemDetail
- [x] `src/lib/db/market-mock.ts` — 10개 품목 mock 데이터
- [x] `src/components/market/MarketHero.tsx` — Hero 헤더 + 검색창
- [x] `src/components/market/MarketSearchInput.tsx` — 품목명 검색
- [x] `src/components/market/PriceChangeList.tsx` — 2열 그리드 drop 카드
- [x] `src/components/market/CategoryQuickAccess.tsx` — 카테고리 필터
- [x] `src/components/market/PopularSection.tsx` — 가로 스크롤 인기 품목
- [x] `src/components/market/PriceTrendChart2.tsx` — 폴센트 스타일 월별 차트 (Recharts)
- [x] `src/components/market/MarketFAQ.tsx` — FAQ 아코디언
- [x] `src/app/market/page.tsx` — 홈 (Hero → drop 카드 → 인기 품목 → FAQ)
- [x] `src/app/market/[item]/page.tsx` — 상세 (헤더 → 차트 → 보관가이드 → FAQ)
- [x] 불필요한 컴포넌트 삭제 (PriceSection, BuyingTimingBanner×2, SeasonalSection, MartPriceList, ItemsSection, PriceTrendChart, Sparkline, market2/)
- [x] `npm run build` 성공

## 일별 데이터 파이프라인 완성 (2026-03-12)

- [x] `src/scripts/fetch-market-daily.ts` — perDay API로 87개 품목 일별 수집 → `market-prices-daily-raw.json`
- [x] `src/scripts/analyze-market-daily.ts` — daily + stats → `market-daily-stats.json` (vs_avg_rate, range_pct, is_cheap)
- [x] `src/scripts/analyze-market-prices.ts` 수정 — market-mapping 특정 조합(item_cd+vrty_cd+grd_cd+se_cd) 필터링으로 재산출
- [x] `src/data/market-stats.json` 재생성 (88개 품목, 동일 기준)

**perDay `exmn_dd_cnvs_prc` 환산 규칙 확인**:
- 중량(kg/g): per-1kg 가격 → `× unit_sz` (또는 `× unit_sz/1000` for g)로 per-package 변환
- 개수(개/마리/포기 등): 이미 per-package

---

## ✅ v3 저렴 필터 완성 (2026-03-21)

**위치**: `src/lib/market-data.ts:295-313` — `getCheapItemsByRegion(sgg_cd, limit=6)`

**2가지 지표** (ComboStats에 저장):
- `percentile`: 과거 월평균 중 현재가 이하인 비율 (0.1 = 역대 10%)
- `cheapness_score`: Z-score 역수 = (전체평균 − 현재가) / 표준편차

**정렬 로직**: 1. percentile 오름차순 → 2. 동점 시 cheapness_score 내림차순 → 3. 상위 6개 반환

**지역 데이터**: 23개 지역 모두 CF-IPCity 매핑 검증 완료 ✅

**구현 완료 항목**:
- [x] 홈 페이지 (`/market`) — Hero + 저렴 6개 카드 + 인기 8개 + FAQ
- [x] 상세 페이지 (`/market/[item]`) — 헤더 + 등급·신선도 토글 + 차트 + FAQ
- [x] 등급·신선도 토글 (`GradeSelector.tsx`)
- [x] 지역별 데이터 (`market-stats-by-region.json`, 23개 지역)
- [x] 계절성 반영 (월별 데이터 기반 Z-score)

---

# K-APT 관리비 주간 결측치 수집 (sync-kapt-mgmt.ts) — 2026-03-04

## 작업 완료

- [x] `fetch-kapt-mgmt.ts` — `fetchCommon/fetchPrivate/fetchRepair/callEndpoint/sleep/getRecentMonths` export 추가
- [x] `fetch-kapt-mgmt.ts` — `isDirectRun` 가드 추가 (import 시 main() 실행 방지)
- [x] `sync-kapt-mgmt.ts` 신규 생성 (schedule.json 기반 결측치 추적)
- [x] `fetch-kapt-mgmt.ts` `callEndpoint()` 버그 수정
  - `inqYm` → `searchDate` (파라미터명)
  - `totalCount` 체크 제거 → `body.item` 직접 접근 (응답 구조 대응)
- [x] 단일 테스트 성공: `A10025110` + `202512` → 인건비 데이터 정상 수신

## 다음 할 일

- [ ] `sync-kapt-mgmt.ts` 본격 실행 (pending 45,694건)
  ```bash
  DATA_GO_KR_API_KEY=<키> npx tsx src/scripts/sync-kapt-mgmt.ts
  ```
- [ ] done=0인 기존 65개 "done" 항목 정리 (실제 데이터 없는 빈 파일 — schedule.json에서 pending으로 리셋 또는 삭제 후 재수집)

---

# apt-mgmt 결과 페이지 500 에러 수정 (2026-02-28)

## 원인 분석

`apt_mgmt_fee`(59컬럼) + `apt_mgmt_fee_summary` 3중 LEFT JOIN(73컬럼) = **132컬럼** → D1 Workers 100컬럼 제한 초과 → `"D1_ERROR: too many columns in result set"` → error.tsx 500 화면.

추가 발견된 문제:
- `getMgmtFeeTopApts`에서 `Promise.all([umdQ, seoulQ])` → D1 동시 쿼리 금지, Worker 비정상 종료
- `page.tsx` catch 블록이 모든 예외를 `notFound()` 변환 → 404로 위장, 실 에러 은폐

## 수정 내용

- [x] `getD1MgmtFeeResult`: 3단계 분리
  - Step 1: `SELECT * FROM apt_mgmt_fee` (59컬럼, 안전)
  - Step 2: `SELECT * FROM apt_mgmt_fee_summary WHERE (3조건)` 최대 3행 → TS로 매핑
  - Step 3: `db.batch()` 10개 COUNT 쿼리 → 순위 계산
- [x] `getMgmtFeeTopApts`: `Promise.all` → `db.batch()`
- [x] `page.tsx`: catch 블록 제거 → error.tsx로 전파
- [x] KV 캐시 키 v9로 갱신 (stale 캐시 무효화)
- [x] 임시 디버그 라우트 삭제 (`/api/apt-mgmt/debug`)
- [x] `npm run build` 성공 / 커밋 & 배포

## 디버깅 도구

- `/api/apt-mgmt/debug?kaptCode=...` — Workers 컨텍스트에서 개별 쿼리 단계 격리 테스트
- `wrangler tail` — 실시간 Worker 로그 스트리밍, 정확한 에러 메시지 확인 (`D1_ERROR: too many columns`)

---

# 관리비 지킴이 백엔드 완성

## 작업 목록

- [x] `create-apt-meta.ts` 단순화 (Step 1 + Step 4만 유지)
- [x] 미커밋 파일 커밋 (scripts 3개 + .claude 문서)
- [x] `create-apt-meta.ts --remote` 실행 → apt_meta 3,335건, per_hh 36,802건(100%) 완료
- [x] `management-fee.ts` window function 2단계 CTE 버그 수정
- [x] 배포 (git push → Cloudflare 자동 빌드)
- [x] `AptMgmtSearchForm` → 텍스트 자동완성 combobox 전환
- [x] 버튼 active 피드백 수정 (`active:scale-95 transition-colors`)
- [x] 순위 로직 개편 (`total_per_hh` 기준 + 공용·개인 비중 비율 RANK())
- [x] `/api/apt-mgmt/apts` 500 에러 수정 (`export const runtime = 'edge'` 제거)

## 설계

- `apt_meta` ← K-apt API 단지 기본정보 (`kapt_code` UNIQUE)
- `apt_mgmt_fee` ← 관리비 XLSX (`kapt_code` 공유)
- JOIN: `apt_mgmt_fee.kapt_code = apt_meta.kapt_code` (직접, FK 불필요)
- per_hh: `apt_mgmt_fee` 금액 / `apt_meta.household_cnt` (사전계산 완료)

## 다음 할 일

- [x] 프로덕션 검증: 실데이터로 순위 결과 확인
- [ ] 애드센스 심사 승인 대기

---

# 관리비 데이터 이상 검증 및 수정

## 검증 결과 (2026-02-28)

포레나송파 검색 결과 수치가 이상해 보여 D1 SQL로 전면 검증 진행.

**결론: 데이터 정확 + 이상값 1건 + UI 표현 문제 발견**

| 수치 | 검증 | 결과 |
|------|------|------|
| 서울시 24점 | seoul_rank=1928/2543 → (2543-1928+1)/2543×100=24 | ✅ 정확 |
| 구내 47점 | sgg_rank=71/132 → (132-71+1)/132×100=47 | ✅ 정확 |
| 동내 40점 | umd_rank=10/15 → (15-10+1)/15×100=40 | ✅ 정확 |
| total_per_hh 332,306원 | (134400605+278511616+13104193)/1282=332,306 | ✅ 정확 |
| billing_ym 왜곡 | 포레나송파=202512, 2543개 단지 비교 | ✅ 왜곡 없음 |

**발견된 문제:**
1. 동대문구 래미안크레시티: household_cnt=1(오염) → total_per_hh=557,043,719원 이상값
2. Tier C "상위 54%" 표현: 중간 수준인데 "상위"로 표시 → 오해 유발

## 수정 완료

- [x] `management-fee.ts` snapshot에 `AND household_cnt >= 10` 조건 추가 (이상값 필터)
- [x] `AptMgmtSummaryCards.tsx` Tier C → "중간 수준" 고정 텍스트 (% 표시 제거)
- [x] `npm run build` 성공 확인
- [x] 커밋 & 배포

---

# 관리비 결과 페이지 UI 개편 — 주요 항목 비교 추가

## 작업 목록

- [x] `src/types/management-fee.ts` — `common_ratio_rank`, `personal_ratio_rank` 제거 → `seoul_avg_total`, `sgg_avg_total`, `common_seoul_rank`, `common_sgg_rank`, `personal_seoul_rank`, `personal_sgg_rank` 추가
- [x] `src/lib/db/management-fee.ts` — SQL window 함수 교체 (비율 RANK → 금액 RANK + AVG), mock 데이터 동기화
- [x] `src/components/apt-mgmt/AptMgmtSummaryCards.tsx` — 바차트 3개만 유지, "주요 항목 비교" 섹션 추가
- [x] `npm run build` 성공 확인 (TypeScript 오류 없음)
- [x] 커밋 & 배포 (git push → Cloudflare 자동 빌드)

## 결과

- 바차트: 서울시/구내/동내 순위 3개만 표시 (공용·개인 비율 순위 제거)
- 주요 항목 비교 카드: 총 관리비·공동관리비·개인관리비 각각 금액 + 서울 상위 % + 구평균 대비 ±% 표시
- 색상: 구평균보다 비쌈 → red-500 ▲, 저렴 → emerald-500 ▼

---

# 공용관리비 항목 누락 여부 검증

## 작업 목록 (2026-02-28)

- [x] `migrate-mgmt-fee.ts` COL 매핑 확인 (COL 7~24: 공용관리비 18개 컬럼)
- [x] `schema.sql` `apt_mgmt_fee` 테이블 스키마 확인
- [x] `create-apt-meta.ts` `step2_perHh()` 계산식 확인
- [x] `types/management-fee.ts` 타입 정의 vs 원본 항목 대조

## 검증 결과

**결론: 35개 항목 모두 누락 없이 저장됨.**

K-APT Excel은 세부 항목을 **이미 집계된 값**으로 제공 → DB는 집계값을 그대로 저장:

| Excel 집계 컬럼 | DB 컬럼 | 포함 세부 항목 |
|---|---|---|
| 인건비 | `labor_cost` | 급여·제수당·상여금·퇴직금·4대보험·복리후생비 (9개) |
| 제사무비 | `office_cost` | 사무용품·도서인쇄·여비·전기료·통신·우편 (6개) |
| 차량유지비 | `vehicle_cost` | 연료비·수리비·보험료·기타차량유지비 (4개) |
| 그밖의부대비용 | `other_overhead` | 관리용품·전문가자문·잡비 (3개) |
| 나머지 13개 | 1:1 매핑 | 청소비·경비비·소독비·승강기·네트워크·수선·시설·안전·재해·위탁 등 |

`common_per_hh = ROUND(common_mgmt_total / household_cnt)` — `common_mgmt_total`이 K-APT 원본 총계이므로 모든 항목 포함.

---

# 공유 버튼 조건부 렌더링

## 작업 목록

- [x] `AptMgmtShareButtons.tsx` — `useEffect`로 `navigator.share` 감지 → `canShare` 상태 추가
- [x] "공유하기" 버튼 `{canShare && ...}` 조건부 렌더링
- [x] `npm run build` 빌드 성공 확인
- [x] 배포 (git push → Cloudflare 자동 빌드)

## 결과

- Safari(iOS)/Chrome(Android): `navigator.share` 지원 → 버튼 표시
- 네이버앱/구버전 WebView: `navigator.share` 미지원 → 버튼 숨김, "링크 복사"만 표시

## Cloudflare 설정 (수동 필요)

- [x] SSL/TLS → Edge Certificates → **Always Use HTTPS** ON
- [x] **Automatic HTTPS Rewrites** ON
- [ ] (선택) HSTS 활성화

---

# 루트 `/` 페이지 콘텐츠 허브 전환

## 목표

네이버 크롤러가 루트에서 내부 링크를 발견하지 못해 다른 페이지 색인 실패 → 실제 콘텐츠 페이지로 교체.

## 작업 목록 (2026-02-28)

- [x] `src/app/page.tsx` 전면 재작성 (permanentRedirect 제거)
  - WebSite JSON-LD + SearchAction 추가
  - 서비스 카드 2개: 관리비 지킴이(`/apt-mgmt`), 실거래가(`/apt`)
  - canonical, OG 메타태그 직접 지정 (title 템플릿 우회)
- [x] sitemap.ts — 루트 `/` 이미 `priority: 1` 포함 확인 (수정 불필요)
- [x] robots.ts — `allow: "/"` 확인 (수정 불필요)
- [x] `npm run build` 성공 (`/` → `○ Static` 렌더링 확인)
- [x] 커밋 & 배포 (git push → Cloudflare 자동 빌드)

## 결과

- 루트 `/`: 308 redirect → 정적 200 허브 페이지
- 봇이 루트에서 `/apt-mgmt`, `/apt` 내부 링크 발견 경로 확보
- WebSite JSON-LD로 구글 사이트링크 검색 박스 노출 기반 마련

---

# 결과 카드 헤더 개편 + apt_mgmt_fee_summary 테이블

## 작업 목록 (2026-02-28)

- [x] `summaryConfig.ts` — 모든 tier title/desc에서 `{apt_nm},` 제거 + 자연스러운 한국어 전면 수정
- [x] `AptMgmtSummaryCards.tsx` — 헤더 교체: "관리비 분석 결과"(1줄) → 단지명(크게) + "관리비 분석 결과"(작게 회색 2줄)
- [x] `src/data/schema.sql` — `apt_mgmt_fee_summary` 테이블 추가
- [x] `src/data/migrate-mgmt-summary.sql` — 신규 마이그레이션 파일 생성 (서울 전체/구/동 3단계 집계)
- [x] `src/types/management-fee.ts` — `MgmtFeeResult`에 신규 36개 필드 추가 (18개 항목 × sgg/umd)
- [x] `src/lib/db/management-fee.ts` — AVG window function 26개 → summary 테이블 3×LEFT JOIN 교체, KV 캐시 v5→v6
- [x] `AptMgmtSummaryCards.tsx` — 18개 activeAvg* 변수 추가 + CompareSection props 전달
- [x] `AptMgmtCompareSection.tsx` — Props 18개 추가 + 모든 SubRow에 avg 연결
- [x] `npm run build` 성공 확인

## 마이그레이션 실행 (배포 후)

```bash
wrangler d1 execute apt-trade-db --remote --file=src/data/migrate-mgmt-summary.sql
```
