## 진행 중인 작업

<!-- 현재 활성 작업을 여기에 기록 -->

---

## 다음 할 일

1. 관리비 지킴이 백엔드:
   a. `npx tsx src/scripts/migrate-mgmt-fee.ts` (XLSX → D1)
   b. `DATA_GO_KR_API_KEY=... npx tsx src/scripts/create-apt-meta.ts --remote`
      (apt_meta 생성 + kapt_code 매핑 + household_cnt API 조회 + per_hh 계산)
   c. `feat/apt-mgmt` → `main` 병합
2. 프로덕션 D1 v4 스키마 마이그레이션 (`migrate-v4.sql` + `create-apt-meta.ts`)
3. 애드센스 심사 승인 대기 (구글 심사 중)
