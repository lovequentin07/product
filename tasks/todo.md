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

- [ ] 프로덕션 검증: 실데이터로 순위 결과 확인
- [ ] 애드센스 심사 승인 대기

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

- [ ] SSL/TLS → Edge Certificates → **Always Use HTTPS** ON
- [ ] **Automatic HTTPS Rewrites** ON
- [ ] (선택) HSTS 활성화
