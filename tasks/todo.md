# 진행 과제 — 2026-05-16 기준

세션이 새로 열린 경우 이 파일을 읽고 미완료 항목부터 진행하세요.

---

## 완료된 항목 (누적)

- [x] 파일 이관: `product_from_localmachine` → `product` (`.env.local`, `ga4-credentials.json`, `tasks/lessons.md` 병합)
- [x] GitHub PAT 설정 후 push 완료
- [x] `src/app/market/[item]/page.tsx` — `generateMetadata()` fallback 수정
- [x] `src/app/page.tsx` — 홈페이지 `<h1>` 누락 수정
- [x] K-APT 관리비 202603 신규 수집 (0 → 2,585건), 202512 재수집 (2,543 → 3,184건)
- [x] D1 202501 삭제 (202502 이전 데이터 정리)
- [x] `update-mgmt-fee.ts` — TARGET_YMS 지원 + PID별 tmp 파일 (병렬 실행 안전)
- [x] `refresh-apt-meta.ts` — 신규 단지 자동 갱신 스크립트 생성
- [x] `update-mgmt-fee.yml` — refresh→collect→cleanup 3단계 워크플로우, UPDATE_MONTHS=2 복원
- [x] `management-fee.ts` — umd_rank/umd_total에 sgg_nm 필터 추가 (구 경계 버그 수정)
- [x] `management-fee.ts` — total_per_hh null 시 순위 계산 스킵 (null 가드)
- [x] `refresh-apt-meta.ts` — normalize() 대신 trim()으로 apt_nm 원본 보존
- [x] Playwright E2E 테스트 추가 (apt/apt-mgmt/market, chromium + Pixel5 mobile, 32개 pass)
- [x] 오래된 feature 브랜치 7개 삭제 (feat/apt-mgmt 등)
- [x] CLAUDE.md, apt-mgmt.md, todo.md 코드 기준 현행화

---

## 참고: K-APT 관리비 수집 구조 (2026-05-16 기준)

- **자동 수집**: `.github/workflows/update-mgmt-fee.yml` — 매월 1일 KST 11:00 자동 실행
  - Step 1: `refresh-apt-meta.ts` — K-APT 신규 단지 apt_meta 자동 추가
  - Step 2: `update-mgmt-fee.ts` — UPDATE_MONTHS=2 (최신 2개월 수집)
  - Step 3: cleanup DELETE — 15개월 이전 데이터 자동 삭제
- **수동 실행**: `TARGET_YMS=YYYYMM npx tsx src/apt-mgmt/scripts/update-mgmt-fee.ts`
- **D1 현황 (2026-05-16)**: 202502~202603 보존 (14개월), 202602·202601=100%, 202603=77%
- **보존 정책**: 최신 월 기준 -15개월 (12개월 차트 + YoY 1개월 + K-APT 딜레이 2개월)
- **단지 한계선**: K-APT 미등록 단지 제외 시 자연 상한 ~93~95%

---

## 남은 과제

- [ ] `apt-mgmt` 서비스 검토 — 관리비 지킴이 서비스 전반적인 기능·UX 점검
- [ ] SEO 점검 — 각 서비스 페이지 `generateMetadata` 품질 확인
- [ ] 애드센스 최적화 — 클릭률 개선을 위한 광고 배치 점검
