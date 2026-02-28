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

- [x] 프로덕션 검증: 실데이터로 순위 결과 확인
- [ ] 애드센스 심사 승인 대기

---

# 관리비 데이터 이상 검증 및 수정

## 검증 결과 (2026-02-28)

포레나송파 검색 결과 수치가 이상해 보여 D1 SQL로 전면 검증 진행.

**결론: 데이터 정확 + 이상값 1건 + UI 표현 문제 발견**

| 수치 | 검증 | 결과 |
|------|------|------|
| 서울시 24점 | seoul_rank=1928/2543 → (2543-1928+1)/2543×100=24 | ✅ 정확 |
| 구내 47점 | sgg_rank=71/132 → (132-71+1)/132×100=47 | ✅ 정확 |
| 동내 40점 | umd_rank=10/15 → (15-10+1)/15×100=40 | ✅ 정확 |
| total_per_hh 332,306원 | (134400605+278511616+13104193)/1282=332,306 | ✅ 정확 |
| billing_ym 왜곡 | 포레나송파=202512, 2543개 단지 비교 | ✅ 왜곡 없음 |

**발견된 문제:**
1. 동대문구 래미안크레시티: household_cnt=1(오염) → total_per_hh=557,043,719원 이상값
2. Tier C "상위 54%" 표현: 중간 수준인데 "상위"로 표시 → 오해 유발

## 수정 완료

- [x] `management-fee.ts` snapshot에 `AND household_cnt >= 10` 조건 추가 (이상값 필터)
- [x] `AptMgmtSummaryCards.tsx` Tier C → "중간 수준" 고정 텍스트 (% 표시 제거)
- [x] `npm run build` 성공 확인
- [x] 커밋 & 배포

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

# 공용관리비 항목 누락 여부 검증

## 작업 목록 (2026-02-28)

- [x] `migrate-mgmt-fee.ts` COL 매핑 확인 (COL 7~24: 공용관리비 18개 컬럼)
- [x] `schema.sql` `apt_mgmt_fee` 테이블 스키마 확인
- [x] `create-apt-meta.ts` `step2_perHh()` 계산식 확인
- [x] `types/management-fee.ts` 타입 정의 vs 원본 항목 대조

## 검증 결과

**결론: 35개 항목 모두 누락 없이 저장됨.**

K-APT Excel은 세부 항목을 **이미 집계된 값**으로 제공 → DB는 집계값을 그대로 저장:

| Excel 집계 컬럼 | DB 컬럼 | 포함 세부 항목 |
|---|---|---|
| 인건비 | `labor_cost` | 급여·제수당·상여금·퇴직금·4대보험·복리후생비 (9개) |
| 제사무비 | `office_cost` | 사무용품·도서인쇄·여비·전기료·통신·우편 (6개) |
| 차량유지비 | `vehicle_cost` | 연료비·수리비·보험료·기타차량유지비 (4개) |
| 그밖의부대비용 | `other_overhead` | 관리용품·전문가자문·잡비 (3개) |
| 나머지 13개 | 1:1 매핑 | 청소비·경비비·소독비·승강기·네트워크·수선·시설·안전·재해·위탁 등 |

`common_per_hh = ROUND(common_mgmt_total / household_cnt)` — `common_mgmt_total`이 K-APT 원본 총계이므로 모든 항목 포함.

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

- [x] SSL/TLS → Edge Certificates → **Always Use HTTPS** ON
- [x] **Automatic HTTPS Rewrites** ON
- [ ] (선택) HSTS 활성화
