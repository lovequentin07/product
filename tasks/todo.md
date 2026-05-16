# 진행 과제 — 2026-05-16 기준

세션이 새로 열린 경우 이 파일을 읽고 미완료 항목부터 진행하세요.

---

## 완료된 항목 (이번 세션)

- [x] 파일 이관: `product_from_localmachine` → `product` (`.env.local`, `ga4-credentials.json`, `tasks/lessons.md` 병합)
- [x] GitHub PAT 설정 후 push 완료 (`1788be4` 커밋 반영)
- [x] 사이트 Playwright 점검 및 코드 교차 검증
- [x] `src/app/market/[item]/page.tsx:34` — `generateMetadata()` 빈 객체 반환 버그 수정 (fallback 메타데이터)
- [x] `src/app/page.tsx` — 홈페이지 `<h1>` 누락 수정
- [x] `src/apt-mgmt/scripts/update-mgmt-fee.ts` — UPDATE_MONTHS 최대 한도 주석 6→14 업데이트 후 커밋

---

## 참고: K-APT 관리비 수집 구조

- **자동 수집**: `.github/workflows/update-mgmt-fee.yml` — 매월 1일 KST 11:00 자동 실행 (`UPDATE_MONTHS=2`)
- **수동 실행 필요 시**: `npx tsx src/apt-mgmt/scripts/update-mgmt-fee.ts` (`.env.local` 자동 로드)
- **D1 현황 (2026-05-16 기준)**: 202601·202602 각 3,335건(완전), 202603 0건(미수집)
- **과거 데이터 gap**: 서비스는 최신 월 순위만 사용 → 과거 gap 메울 필요 없음
- **202603 수집 필요 시**: `UPDATE_MONTHS=2 npx tsx src/apt-mgmt/scripts/update-mgmt-fee.ts`
