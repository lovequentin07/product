# 다음 작업 계획 — 2026-02-21

## 선결 조건
feat/real-estate-ui → main 머지는 **D1 연동 완료 후** 진행.
그 전까지 모든 개발은 feat/real-estate-ui 브랜치에서 계속.

---

## 우선순위 1: Analytics 변경사항 커밋

현재 미커밋 상태인 파일들을 feat/real-estate-ui에 커밋.

```bash
git add src/app/layout.tsx src/app/robots.ts src/app/sitemap.ts
git commit -m "feat: Add GA4, Clarity analytics and SEO files (robots, sitemap)"
```

---

## 우선순위 2: D1 연동 준비

데이터 수집이 완료되면 즉시 진행할 수 있도록 준비.

### 2-1. 스키마 확인 및 D1 생성
- `src/data/schema.sql` 검토
- Cloudflare D1 데이터베이스 실제 생성: `npx wrangler d1 create apt-trade-db`
- `wrangler.jsonc`의 `database_id` 업데이트

### 2-2. 마이그레이션 스크립트 작성
- `src/scripts/migrate-to-d1.ts`: `raw-data/seoul/YYYY/MM.jsonl` → D1 insert
- 배치 처리 (D1 API 제한: 10,000 rows/batch)
- 진행 상황 추적 (combinations.json 참고)

### 2-3. DB 레이어 교체
- `src/lib/db/transactions.ts`: Mock → D1 쿼리 (`SELECT ... FROM transactions`)
- `src/lib/db/apt.ts`: Mock → D1 쿼리
- 환경변수 분기: 로컬 Mock / 프로덕션 D1

### 2-4. 내부 API 검토
- `/api/transactions`, `/api/apt/[sgg_cd]/[apt_nm]/history` 라우트 확인
- D1 바인딩 (`env.DB`) 연결

---

## 우선순위 3: main 머지 + 검증

D1 연동 및 테스트 완료 후:

```bash
git checkout main
git merge feat/real-estate-ui
git push origin main
```

머지 후 확인:
- 실거래 데이터 정상 조회 (D1 기반)
- GA4 실시간 보고서에서 페이지뷰 이벤트 수신
- Clarity 대시보드 세션 기록 시작
- `/sitemap.xml`, `/robots.txt` 접속 확인

---

## 우선순위 4: 메인 허브 페이지 (`/`)

현재 플레이스홀더 수준. D1 연동 이후 의미 있는 콘텐츠 구성 가능.
- 서비스 소개 + 주요 통계 (전체 거래 수, 최근 거래 등)
- SEO 허브 역할 (각 서비스 링크 + 설명)

---

## 데이터 수집 상태
- 현재 약 61% 진행 중
- 완료 후 → 우선순위 2 즉시 착수
