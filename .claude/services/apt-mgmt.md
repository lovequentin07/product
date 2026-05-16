# 서비스: 관리비 지킴이 (`/apt-mgmt`)

## 개요

아파트 단지별 관리비를 분석하고 타 단지와 비교하는 서비스.
- **URL**: `datazip.net/apt-mgmt`, `datazip.net/apt-mgmt/{sgg_nm}/{apt_nm}?kaptCode=...`
- **상태**: 프로덕션 (main 브랜치)
- **DB 테이블**: `apt_mgmt_fee`, `apt_mgmt_fee_summary`, `apt_meta`

## 서비스 플로우

```
/apt-mgmt (랜딩)
  → 구 선택 → 아파트 선택 (API: /api/apt-mgmt/apts?sgg_nm=강남구)
  → /apt-mgmt/{sgg_nm}/{apt_nm}?kaptCode={code}
  → AptMgmtResultClient (로더 애니메이션 ~3초 → 결과)
  → AptMgmtSummaryCards + AptMgmtReportCards + AptMgmtHistoryChart
    + AptMgmtBuildingChart + AptMgmtComparisonTable + AptMgmtCompareSection
```

## URL 파라미터

| 파라미터 | 설명 |
|----------|------|
| `kaptCode` | K-apt 단지코드 (예: A10001000) |

## 핵심 파일

| 역할 | 파일 |
|------|------|
| 랜딩 페이지 | `src/app/apt-mgmt/page.tsx` |
| 결과 페이지 | `src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx` |
| 에러 바운더리 | `src/app/apt-mgmt/[sgg_nm]/[apt_nm]/error.tsx` |
| DB 레이어 | `src/apt-mgmt/lib/db/management-fee.ts` |
| 아파트 목록 API | `src/app/api/apt-mgmt/apts/route.ts` |
| 타입 정의 | `src/apt-mgmt/types/management-fee.ts` |

## 컴포넌트 (`src/apt-mgmt/components/`)

| 컴포넌트 | 역할 |
|----------|------|
| `AptMgmtSearchForm` | 구→아파트 2단계 선택 폼 |
| `AptMgmtAnalysisLoader` | 단계별 분석 애니메이션 (~3초) |
| `AptMgmtResultClient` | 로더→결과 전환 상태 관리 |
| `AptMgmtSummaryCards` | 결과 요약 (상위 X%, 5개 바 차트) |
| `AptMgmtReportCards` | 공용관리비/경비청소비/장충금 3카드 |
| `AptMgmtHistoryChart` | 월별 관리비 추이 차트 (12개월) |
| `AptMgmtBuildingChart` | 건물별 비용 비교 차트 |
| `AptMgmtComparisonTable` | 4컬럼 세부 비교표 |
| `AptMgmtCompareSection` | 피어 그룹 비교 섹션 |
| `AptMgmtTopAptRecommend` | 추천 아파트 리스트 |
| `AptMgmtShareButtons` | 링크 복사/공유 (소형 버튼) |
| `summaryConfig.ts` | 티어별 제목·설명 텍스트 (A~E, {변수} 템플릿) |

## AptMgmtSummaryCards UI 구조

1. **헤더**: "관리비 분석 결과" + `{sgg_nm} {umd_nm} {apt_nm}`
2. **메인**: "상위 X%" (text-4xl) + 감성 제목 + 설명 (sgg_rank 기준)
3. **바 차트** (5개):
   - 절약 점수 = `(total - rank + 1) / total * 100` (높을수록 좋음)
   - ≥67점: 초록 / 40~66점: 노랑 / <40점: 빨강
   - 순서: 서울시 순위 / 구내 순위 / 동내 순위 / 공용관리비 / 개인관리비
4. **공유 버튼**: 소형 (py-1.5 px-4 text-xs)

### 티어별 색상
- A: emerald-500 / B: emerald-400 / C: amber-500 / D: red-400 / E: red-600

## 데이터 수집 자동화

**워크플로우**: `.github/workflows/update-mgmt-fee.yml` — 매월 1일 KST 11:00 자동 실행

```
Step 1: refresh-apt-meta.ts    # K-APT에서 신규 단지 apt_meta 자동 추가
Step 2: update-mgmt-fee.ts     # 최신 2개월 관리비 수집 (CONCURRENCY=10, 50개씩 배치 UPSERT)
Step 3: cleanup DELETE         # 현재월 -15개월 이전 데이터 자동 삭제
```

**수동 실행** (특정 월 재수집):
```bash
TARGET_YMS=202603,202512 npx tsx src/apt-mgmt/scripts/update-mgmt-fee.ts
```

## 데이터 보존 정책

- **보존 범위**: 최신 billing_ym 기준 -15개월 (12개월 차트 + YoY 1개월 + K-APT 딜레이 2개월)
- **삭제 기준**: `DELETE FROM apt_mgmt_fee WHERE billing_ym < '${CUTOFF}'` (CUTOFF = 현재월 -15개월)
- **자연 한계선**: K-APT 미등록 단지 제외 시 ~93~95% (나머지는 재수집해도 개선 없음)
- **D1 현황 (2026-05-16)**: 202502~202603 보존 (14개월), 202601·202602=100%, 202603=77%

## DB 스키마 핵심

```sql
-- src/shared/data/schema.sql 참고
apt_mgmt_fee       -- 월별 단지 관리비 상세 (UNIQUE: kapt_code, billing_ym)
apt_mgmt_fee_summary  -- 사전집계 요약 (billing_ym × 서울/구/동)
apt_meta           -- 단지 마스터 (kapt_code UNIQUE, apt_seq UNIQUE)
```

### umd_rank 주의사항
- 서울 내 동명(洞名) 중복 존재 → `umd_rank/umd_total` 쿼리에 반드시 `sgg_nm` 필터 포함
- `management-fee.ts:545-546`에 이미 반영됨

## 데이터 출처

- **API**: 국토교통부 공동주택관리비 정보제공서비스 (K-apt)
- **API 명세**: `.claude/api/kapt_mgmt_api/`
