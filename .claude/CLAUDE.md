# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code(claude.ai/code)에게 제공되는 가이드입니다.

## 프로젝트 개요

공공데이터포털 API를 활용하여 유용한 정보를 제공하고, 고단가 애드센스 수익을 창출하는 서울 아파트 실거래가 조회 서비스입니다.

- **도메인**: `product.com`
- **핵심 가치**:
  1. **데이터 정합성**: 공공데이터 API의 불규칙한 응답에 대비한 방어적 코드 작성
  2. **수익 극대화**: 애드센스 클릭률을 높이는 UI 배치와 SEO 메타데이터 자동 생성
  3. **확장성**: 동일한 패턴의 `lib/api`와 `types` 구조를 유지하여 서비스 무한 확장 지원

## 명령어

```bash
npm install              # 의존성 설치
npm run dev              # 로컬 개발 서버 (Next.js, mock 데이터 17건)
npm run preview          # ⚠️ Free 플랜 CPU 제한(10ms)으로 동작하지 않음 — 브랜치 push로 Cloudflare Preview URL 사용
npm run build            # 표준 Next.js 빌드
npm run build:cloudflare # Cloudflare 최적화 빌드 (OpenNext)
npm run lint             # ESLint 실행
```

**배포는 `git push`로 자동 실행** — Cloudflare가 GitHub 푸시를 감지해 자동 빌드·배포. `npm run deploy`는 사용하지 않음.

테스트 명령어는 없음. `src/scripts/`의 데이터 스크립트는 `npx tsx`로 실행.

## 아키텍처

**기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, `@opennextjs/cloudflare`를 통해 **Cloudflare Workers**에 배포. 데이터는 Cloudflare D1(SQLite, 131만건)에서 조회하며, 로컬 개발 시 mock 폴백 사용.

**데이터 플로우**:
1. `SearchForm`(클라이언트)에서 지역·날짜 선택 → URL 쿼리 파라미터 (`lawdCd`, `dealYmd`, `pageNo`, `sortBy`, `sortDir`, `searchTerm`) push
2. 서버 컴포넌트(`src/app/real-estate/transaction/page.tsx`)가 `searchParams`를 읽고 `getTransactions()` 호출
3. `src/lib/db/transactions.ts`가 D1에 SQL 쿼리 (정렬·필터·페이지네이션 모두 서버사이드)
4. `TransactionRow[]`를 `NormalizedTransaction[]`으로 변환 후 `TransactionsClientComponent`에 전달
5. 클라이언트는 면적·가격 필터(클라이언트 로컬)만 추가 처리

**클라이언트 상태**: `TransactionsClientComponent`가 아파트명 검색(500ms 디바운스 URL 업데이트), 정렬(URL 기반) 상태를 관리하고 `TransactionList`(표현 컴포넌트)에 전달.

## 개발 컨벤션

- **API 연동**: 모든 외부 API 호출은 반드시 `src/lib/api/client.ts`를 경유 — 컴포넌트/페이지에서 직접 `fetch` 금지
- **데이터 정규화**: 새 데이터 소스는 `src/lib/api/`에 파일 추가 후 `src/types/`의 타입 인터페이스로 정규화
- **방어적 코딩**: 공공데이터 API 응답의 필드 누락·타입 불일치에 대비해 Optional Chaining(`?.`)과 fallback 값 적극 사용
- **SEO**: 각 서비스 페이지에 `generateMetadata` 구현 필수
- **보안**: API 키는 서버 사이드에서만 사용 (클라이언트에서 외부 API 직접 호출 금지)

## 서비스 구조 전략

- **Sub-route 방식**: 각 서비스는 SEO 최적화를 위해 독립된 고유 경로(URL) 사용 (예: `/real-estate/transaction`)
- **단계적 개발**: 개별 서브 서비스 개발에 우선 집중, 메인 허브(`page.tsx`)는 추후에 통합 구축
- **분석 연동**: GA4 및 Microsoft Clarity를 통한 사용자 행동 분석 및 광고 수익 최적화 예정

## 데이터 저장

- **프로덕션 DB**: Cloudflare D1 (`apt-trade-db`, ID: `a65766e9-f184-4771-bbf6-4139d0f7b6a8`). 바인딩명 `DB`, 스키마: `src/data/schema.sql`. 131만건 (2006~2026). 사전 계산 컬럼: `deal_amount_billion`, `area_pyeong`, `price_per_pyeong`
- **로컬 개발**: D1 연결 불가 → `src/lib/db/mock-data.ts` mock 17건으로 폴백. 실제 데이터 테스트는 비프로덕션 브랜치 push → Cloudflare Preview URL 사용
- **원본 JSONL**: `raw-data/seoul/YYYY/MM.jsonl` (~423MB, git 제외) — 마이그레이션 완료, 이후 신규 데이터 추가 시에만 사용
- **데이터 스크립트** (`src/scripts/`): `fetch-historical.ts`(원시 데이터 다운로드), `migrate-to-d1.ts`(D1 마이그레이션), `verify-data-integrity.ts`(데이터 검증)

## Cloudflare 배포

**자동배포**: GitHub `main` 브랜치에 push하면 Cloudflare가 자동으로 빌드·배포. `npm run deploy`는 사용하지 않음.

**Branch Preview**: 비프로덕션 브랜치에 push하면 Preview URL 자동 생성 (`<브랜치명>-product.lovequentin07.workers.dev`).
활성화: Cloudflare 대시보드 → Workers & Pages → `product` → Settings → Build → Branch control → "Enable non-production branch deployments"

설정 파일은 `wrangler.jsonc` (`.toml` 아님). D1 바인딩명은 `DB`. 빌드 결과물은 `.open-next/worker.js`. `.wrangler/` 캐시 디렉토리는 git 제외.

## 경로 별칭

`@/*` → `./src/*` (`tsconfig.json` 설정)
