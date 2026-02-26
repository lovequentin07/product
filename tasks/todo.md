# 관리비 지킴이 백엔드 완성

## 작업 목록

- [x] `create-apt-meta.ts` 단순화 (Step 1 + Step 4만 유지)
- [x] 미커밋 파일 커밋 (scripts 3개 + .claude 문서)
- [x] `create-apt-meta.ts --remote` 실행 → apt_meta 3,335건, per_hh 36,802건(100%) 완료
- [x] `management-fee.ts` window function 2단계 CTE 버그 수정
- [x] 배포 (git push → Cloudflare 자동 빌드)

## 설계

- `apt_meta` ← K-apt API 단지 기본정보 (`kapt_code` UNIQUE)
- `apt_mgmt_fee` ← 관리비 XLSX (`kapt_code` 공유)
- JOIN: `apt_mgmt_fee.kapt_code = apt_meta.kapt_code` (직접, FK 불필요)
- per_hh: `apt_mgmt_fee` 금액 / `apt_meta.household_cnt` (쿼리 또는 사전계산)
