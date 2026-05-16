## Execution Workflow

모든 작업은 WORKFLOW.md에 적힌 규칙을 준수하여 진행합니다.
ALWAYS follow strict execution WORKFLOW.md workflow for Claude Code.

**⚠️ CRITICAL: 모든 코딩 요청은 반드시 EnterPlanMode로 시작 필수**
- 기능 구현, 버그 수정, 리팩토링 등 코드 변경 작업 → 반드시 플랜 모드
- Explore agent로 코드 탐색 → Plan agent로 구현 설계 → 사용자 승인 → 실행
- 이렇게 해야 원인 파악 후 정확한 해결책을 찾을 수 있음

- Detailed execution rules are defined in `.claude/WORKFLOW.md`.
- Task planning and progress tracking must be done in `tasks/todo.md`.
- Repeated mistakes must be recorded in `tasks/lessons.md`.
- Never mark work as done without verification.


## 프로젝트 개요

공공데이터포털 API를 활용하여 유용한 정보를 제공하고, 고단가 애드센스 수익을 창출합니다.

- **도메인**: `datazip.net`
- **핵심 가치**:
  1. **데이터 정합성**: 공공데이터 API의 불규칙한 응답에 대비한 방어적 코드 작성
  2. **수익 극대화**: 애드센스 클릭률을 높이는 UI 배치와 SEO 메타데이터 자동 생성
  3. **확장성**: 동일한 패턴의 `lib/api`와 `types` 구조를 유지하여 서비스 무한 확장 지원

## 서비스 목록

| 서비스 | URL | 상태 | 상세 문서 |
|--------|-----|------|-----------|
| 농수축산물 시세 | `/market` | 프로덕션 | `.claude/services/market.md` |
| 아파트 실거래가 | `/apt` | 프로덕션 | `.claude/services/apt.md` |
| 관리비 지킴이 | `/apt-mgmt` | 프로덕션 | `.claude/services/apt-mgmt.md` |

> 신규 서비스 추가 시: `services/{name}.md` 파일 생성 → 이 표에 한 줄 추가

## 명령어

```bash
npm install              # 의존성 설치
npm run dev              # 로컬 개발 서버 (Next.js, mock 데이터)
npm run preview          # ⚠️ Free 플랜 CPU 제한(10ms)으로 동작하지 않음
npm run build            # 표준 Next.js 빌드
npm run build:cloudflare # Cloudflare 최적화 빌드 (OpenNext)
npm run lint             # ESLint 실행
npx playwright test      # E2E 테스트 (chromium + Pixel5 mobile, baseURL: datazip.net)
```

**배포는 `git push`로 자동 실행** — Cloudflare가 GitHub 푸시를 감지해 자동 빌드·배포.
상세 개발 환경: `.claude/dev-guide.md`

## 아키텍처

**기술 스택**: Next.js 16 (App Router) + TypeScript + React 19 + Tailwind CSS 4, `@opennextjs/cloudflare`를 통해 **Cloudflare Workers**에 배포.

**데이터**: Cloudflare D1(SQLite). 로컬 개발 시 각 서비스별 mock 폴백 사용.

**Cloudflare 인프라**:
- 설정 파일: `wrangler.jsonc` (`.toml` 아님)
- D1 바인딩: `DB` (apt-trade-db) / KV 바인딩: `CACHE`
- 빌드 결과물: `.open-next/worker.js`
- Branch Preview URL: `<브랜치명>-product.lovequentin07.workers.dev`

## 개발 컨벤션

- **API 연동**: 모든 외부 API 호출은 반드시 `src/shared/lib/api/client.ts`를 경유 — 컴포넌트/페이지에서 직접 `fetch` 금지
- **데이터 정규화**: 새 데이터 소스는 해당 서비스 `lib/api/`에 파일 추가 후 `types/` 인터페이스로 정규화
- **방어적 코딩**: 공공데이터 API 응답의 필드 누락·타입 불일치에 대비해 Optional Chaining(`?.`)과 fallback 값 적극 사용
- **SEO**: 각 서비스 페이지에 `generateMetadata` 구현 필수
- **보안**: API 키는 서버 사이드에서만 사용 (클라이언트에서 외부 API 직접 호출 금지)
- **프론트 먼저**: 신규 서비스는 mock 데이터로 프론트엔드 완성 후 백엔드/데이터 작업 진행
- **데이터 미수집 Fallback**: 공공 API/DB에서 데이터를 찾지 못한 경우, `notFound()`(404) 대신 `<DataNotFound>` 컴포넌트(`src/shared/components/ui/DataNotFound.tsx`)를 렌더링. 404는 URL 자체가 잘못된 경우(존재하지 않는 경로, 유효하지 않은 파라미터)에만 사용. HTTP 200으로 사용자에게 "아직 수집되지 않았습니다" 안내 + 검색 페이지 복귀 유도.
- **D1 쿼리**: 동시 쿼리 절대 금지 → `db.batch([...])` 사용. `Promise.all`로 D1 쿼리 병렬화 금지. 결과 컬럼 합계 100개 이하 유지.

## 서비스 구조 전략

- **Sub-route 방식**: 각 서비스는 SEO 최적화를 위해 독립된 고유 경로 사용 (예: `/apt`, `/apt/강남구`)
- **서비스별 모듈화**: 각 서비스는 `src/{service}/` 하위에 components, lib, types, scripts, data를 독립 관리
- **D1 접근**: `getCloudflareContext()` → `env.DB` (로컬에선 mock fallback)

## 경로 별칭

`@/*` → `./src/*` (`tsconfig.json` 설정)

## 폴더 구조

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 루트 레이아웃 (AdSense·GA4·Clarity 스크립트)
│   ├── page.tsx                      # 허브 홈 페이지
│   ├── robots.ts / sitemap.ts        # SEO
│   ├── about/page.tsx                # 소개 페이지
│   ├── contact/page.tsx              # 연락처 페이지
│   ├── privacy-policy/page.tsx       # 개인정보처리방침
│   ├── api/
│   │   ├── transactions/             # GET /api/transactions (실거래가)
│   │   ├── apt/[sgg_cd]/[apt_nm]/history/  # GET /api/apt/history (단지 거래 이력)
│   │   └── apt-mgmt/apts/            # GET /api/apt-mgmt/apts (관리비 단지 목록)
│   ├── market/                       # 농수축산물 시세 서비스
│   │   ├── page.tsx                  # 메인 검색/추천 페이지
│   │   └── [item]/page.tsx           # 품목 상세 페이지 (ID 기반 URL)
│   ├── apt/                          # 실거래가 서비스
│   │   ├── page.tsx                  # 검색 페이지 (서울 전체)
│   │   ├── [sgg_nm]/page.tsx         # 구별 조회 페이지
│   │   └── [sgg_nm]/[apt_nm]/page.tsx  # 단지 상세 페이지
│   ├── apt-mgmt/                     # 관리비 지킴이 서비스
│   │   ├── page.tsx                  # 검색 페이지
│   │   ├── [sgg_nm]/[apt_nm]/page.tsx  # 분석 결과 페이지
│   │   └── [sgg_nm]/[apt_nm]/error.tsx # 에러 바운더리
│   └── guide/                        # SEO 가이드 페이지 모음
│       ├── apt-price-guide/page.tsx
│       ├── mgmt-fee-guide/page.tsx
│       ├── market-price-guide/page.tsx
│       └── market-shopping-guide/page.tsx
│
├── apt/                              # 실거래가 서비스 모듈
│   ├── lib/
│   │   ├── db/apt.ts                 # 실거래가 D1 쿼리
│   │   ├── db/transactions.ts        # 거래 내역 D1 쿼리
│   │   ├── api/apartment.ts          # 실거래가 API 헬퍼
│   │   └── apt-utils.ts
│   ├── types/real-estate.ts
│   ├── components/
│   │   ├── apartment/                # 목록 페이지용 UI
│   │   └── apt-detail/               # 단지 상세 UI (차트 포함)
│   ├── data/migrate-v4.sql
│   └── scripts/                      # 데이터 수집·마이그레이션 스크립트
│
├── apt-mgmt/                         # 관리비 지킴이 서비스 모듈
│   ├── lib/db/management-fee.ts      # 관리비 D1 쿼리 (핵심)
│   ├── types/management-fee.ts
│   ├── components/                   # 11개 UI 컴포넌트
│   │   ├── AptMgmtSearchForm.tsx
│   │   ├── AptMgmtAnalysisLoader.tsx
│   │   ├── AptMgmtResultClient.tsx
│   │   ├── AptMgmtSummaryCards.tsx
│   │   ├── AptMgmtReportCards.tsx
│   │   ├── AptMgmtHistoryChart.tsx   # 월별 관리비 추이 차트
│   │   ├── AptMgmtBuildingChart.tsx  # 건물별 비용 비교 차트
│   │   ├── AptMgmtComparisonTable.tsx
│   │   ├── AptMgmtCompareSection.tsx
│   │   ├── AptMgmtTopAptRecommend.tsx
│   │   ├── AptMgmtShareButtons.tsx
│   │   └── summaryConfig.ts
│   ├── data/migrate-mgmt-summary.sql
│   └── scripts/
│       ├── update-mgmt-fee.ts        # K-APT 관리비 갱신 (GitHub Actions용, TARGET_YMS 지원)
│       ├── refresh-apt-meta.ts       # 신규 단지 자동 등록
│       ├── fetch-kapt-list.ts
│       ├── fetch-kapt-info.ts
│       ├── fetch-kapt-mgmt.ts
│       └── sync-kapt-mgmt.ts
│
├── market/                           # 농수축산물 시세 서비스 모듈
│   ├── lib/
│   │   ├── db/market.ts
│   │   ├── api/public-data-client.ts
│   │   ├── market-data.ts
│   │   └── region.ts
│   ├── types/market.ts
│   ├── components/                   # MarketHero, PriceTrendChart 등
│   ├── data/market-stats-by-region.json
│   └── scripts/update-market.ts
│
├── shared/                           # 서비스 공통 모듈
│   ├── lib/
│   │   ├── api/client.ts             # 외부 API fetch 공통 클라이언트 ← 직접 fetch 대신 이것 사용
│   │   └── db/
│   │       ├── apt-meta.ts           # 단지 메타 D1 쿼리
│   │       ├── mock-data.ts          # 로컬 개발용 mock fallback
│   │       └── types.ts
│   ├── types/apt-meta.ts
│   ├── components/
│   │   ├── Footer.tsx
│   │   └── ui/
│   │       ├── DataNotFound.tsx      # 데이터 미수집 안내 컴포넌트
│   │       ├── SectionCard.tsx
│   │       ├── PrimaryButton.tsx
│   │       ├── AccentLabel.tsx
│   │       └── ServiceLayout.tsx
│   └── data/
│       ├── schema.sql                # D1 테이블 정의 (통합, 7개 테이블)
│       └── regions.ts                # 지역 코드 목록

e2e/                                  # Playwright E2E 테스트
├── apt.spec.ts                       # TC-A1~A5 실거래가
├── apt-mgmt.spec.ts                  # TC-AM1~AM6 관리비
└── market.spec.ts                    # TC-M1~M5 시세

.github/workflows/
├── update-data.yml                   # 실거래가 일일 갱신 (매일 06:30 KST)
├── update-market.yml                 # 시세 평일 갱신 (평일 10:00 KST)
└── update-mgmt-fee.yml               # 관리비 월간 갱신 (매월 1일 11:00 KST)
                                      #   Step1: refresh-apt-meta → Step2: update-mgmt-fee
                                      #   → Step3: cleanup (15개월 이전 DELETE)

.claude/
├── CLAUDE.md                         # 이 파일 (프로젝트 지침)
├── WORKFLOW.md                       # 작업 실행 규칙
├── dev-guide.md                      # 개발 환경 상세
├── api/kapt_mgmt_api/                # K-APT API 명세
└── services/                         # 서비스별 상세 문서

tasks/
├── todo.md                           # 작업 계획·진행 추적
└── lessons.md                        # 반복 실수 기록

playwright.config.ts                  # E2E 테스트 설정 (baseURL: https://datazip.net)
```

.env.local                            # API 키 (DATA_GO_KR_API_KEY 등)
