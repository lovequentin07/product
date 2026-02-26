## Execution Workflow

모든 작업은 WORKFLOW.md에 적힌 규칙을 준수하여 진행합니다. 
ALWAYS follow strict execution WORKFLOW.md workflow for Claude Code.

- For any non-trivial task, enter plan mode first.
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
| 아파트 실거래가 | `/apt` | 프로덕션 | `.claude/services/apt.md` |
| 관리비 지킴이 | `/apt-mgmt` | 개발 중 (feat/apt-mgmt) | `.claude/services/apt-mgmt.md` |

> 신규 서비스 추가 시: `services/{name}.md` 파일 생성 → 이 표에 한 줄 추가

## 명령어

```bash
npm install              # 의존성 설치
npm run dev              # 로컬 개발 서버 (Next.js, mock 데이터)
npm run preview          # ⚠️ Free 플랜 CPU 제한(10ms)으로 동작하지 않음
npm run build            # 표준 Next.js 빌드
npm run build:cloudflare # Cloudflare 최적화 빌드 (OpenNext)
npm run lint             # ESLint 실행
```

**배포는 `git push`로 자동 실행** — Cloudflare가 GitHub 푸시를 감지해 자동 빌드·배포.
상세 개발 환경: `.claude/dev-guide.md`

## 아키텍처

**기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, `@opennextjs/cloudflare`를 통해 **Cloudflare Workers**에 배포.

**데이터**: Cloudflare D1(SQLite). 로컬 개발 시 각 서비스별 mock 폴백 사용.

**Cloudflare 인프라**:
- 설정 파일: `wrangler.jsonc` (`.toml` 아님)
- D1 바인딩: `DB` / KV 바인딩: `CACHE`
- 빌드 결과물: `.open-next/worker.js`
- Branch Preview URL: `<브랜치명>-product.lovequentin07.workers.dev`

## 개발 컨벤션

- **API 연동**: 모든 외부 API 호출은 반드시 `src/lib/api/client.ts`를 경유 — 컴포넌트/페이지에서 직접 `fetch` 금지
- **데이터 정규화**: 새 데이터 소스는 `src/lib/api/`에 파일 추가 후 `src/types/`의 타입 인터페이스로 정규화
- **방어적 코딩**: 공공데이터 API 응답의 필드 누락·타입 불일치에 대비해 Optional Chaining(`?.`)과 fallback 값 적극 사용
- **SEO**: 각 서비스 페이지에 `generateMetadata` 구현 필수
- **보안**: API 키는 서버 사이드에서만 사용 (클라이언트에서 외부 API 직접 호출 금지)
- **프론트 먼저**: 신규 서비스는 mock 데이터로 프론트엔드 완성 후 백엔드/데이터 작업 진행

## 서비스 구조 전략

- **Sub-route 방식**: 각 서비스는 SEO 최적화를 위해 독립된 고유 경로 사용 (예: `/apt`, `/apt/강남구`)
- **단계적 개발**: 개별 서브 서비스 개발에 우선 집중, 메인 허브(`page.tsx`)는 추후 통합 구축
- **D1 접근**: `getCloudflareContext()` → `env.DB` (로컬에선 mock fallback)

## 경로 별칭

`@/*` → `./src/*` (`tsconfig.json` 설정)


