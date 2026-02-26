# 관리비 지킴이 백엔드 완성

## 작업 목록

- [ ] `create-apt-meta.ts` 단순화 (Step 1 + Step 4만 유지)
- [ ] 미커밋 파일 커밋 (scripts 3개 + .claude 문서)
- [ ] `create-apt-meta.ts --remote` 실행 → apt_meta 생성 + per_hh 계산
- [ ] `management-fee.ts` 실DB 전환 (kapt_code JOIN 쿼리)
- [ ] 배포 및 검증

## 설계

- `apt_meta` ← K-apt API 단지 기본정보 (`kapt_code` UNIQUE)
- `apt_mgmt_fee` ← 관리비 XLSX (`kapt_code` 공유)
- JOIN: `apt_mgmt_fee.kapt_code = apt_meta.kapt_code` (직접, FK 불필요)
- per_hh: `apt_mgmt_fee` 금액 / `apt_meta.household_cnt` (쿼리 또는 사전계산)
