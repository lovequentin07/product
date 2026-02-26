# 서비스: 관리비 지킴이 (`/apt-mgmt`)

## 개요

아파트 단지별 관리비를 분석하고 타 단지와 비교하는 서비스.
- **URL**: `datazip.net/apt-mgmt`, `datazip.net/apt-mgmt/{sgg_nm}/{apt_nm}?kaptCode=...`
- **브랜치**: `feat/apt-mgmt` (main 미병합, 백엔드 데이터 준비 후 병합 예정)
- **DB 테이블**: `apt_mgmt_fee` (구 `mgmt_fee`, v4 스키마)

## 개발 상태

- **프론트엔드**: 완료 (mock 데이터로 동작)
- **백엔드**: 미완료 — XLSX → D1 마이그레이션 필요

## 서비스 플로우

```
/apt-mgmt (랜딩)
  → 구 선택 → 아파트 선택 (API: /api/apt-mgmt/apts?sgg_nm=강남구)
  → /apt-mgmt/{sgg_nm}/{apt_nm}?kaptCode={code}
  → AptMgmtResultClient (로더 애니메이션 ~3초 → 결과)
  → AptMgmtSummaryCards + AptMgmtReportCards + AptMgmtComparisonTable
```

## URL 파라미터

| 파라미터 | 설명 |
|----------|------|
| `kaptCode` | K-apt 단지코드 (예: A10001000) |

## Mock 데이터

- **파일**: `src/lib/db/management-fee.ts`
- **MOCK_APTS**: 5건 (래미안대치팰리스/은마/타워팰리스/개포주공/삼성현대)
- **MOCK_RESULTS**: kapt_code별 5개 — A~E 티어 각각 커버
- **분기**: `getMgmtFeeResult`에서 `MOCK_RESULTS[kapt_code]`로 로컬 5케이스 확인 가능

## 핵심 파일

| 역할 | 파일 |
|------|------|
| 랜딩 페이지 | `src/app/apt-mgmt/page.tsx` |
| 결과 페이지 | `src/app/apt-mgmt/[sgg_nm]/[apt_nm]/page.tsx` |
| DB 레이어 | `src/lib/db/management-fee.ts` |
| 아파트 목록 API | `src/app/api/apt-mgmt/apts/route.ts` |
| 타입 정의 | `src/types/management-fee.ts` |

## 컴포넌트 (`src/components/apt-mgmt/`)

| 컴포넌트 | 역할 |
|----------|------|
| `AptMgmtSearchForm` | 구→아파트 2단계 선택 폼 |
| `AptMgmtAnalysisLoader` | 단계별 분석 애니메이션 (~3초) |
| `AptMgmtSummaryCards` | 결과 요약 (상위 X%, 5개 바 차트) |
| `AptMgmtReportCards` | 공용관리비/경비청소비/장충금 3카드 |
| `AptMgmtComparisonTable` | 4컬럼 세부 비교표 |
| `AptMgmtResultClient` | 로더→결과 전환 상태 관리 |
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

## DB 스키마

```sql
-- src/data/schema.sql 참고
CREATE TABLE apt_mgmt_fee (
  kapt_code TEXT,
  mgmt_year INTEGER,
  ...
);
```

## 백엔드 완료 작업 (순서)

> ✅ 완료: migrate-mgmt-fee.ts (36,802행), migrate-v4.sql (프로덕션), feat/apt-mgmt → main 병합

### 남은 작업: apt_meta 생성

```bash
# 1. 서울 전체 단지 목록 수집 (AptListService3) ✅ 완료
#    → raw-data/kapt-list.json (서울 3,337개)
#    주의: endpoint=/getTotalAptList3, items 직접 배열, 동명=as3

# 2. 단지별 상세 정보 수집 (getAphusBassInfoV4) ✅ 완료
#    → raw-data/kapt-info/{kapt_code}.json (3,337개 전문 저장)

# 3. apt_meta 생성 + bjdCode 매칭 + per_hh 계산 ← 다음 실행
npx tsx src/scripts/create-apt-meta.ts --remote
```

## 데이터 출처

- **관리비 XLSX**: `.claude/data_source/20260220_단지_관리비정보.xlsx`
- **공공데이터 API 레퍼런스**: `.claude/data_source/apt-mgmt.md`
- **API**: 국토교통부 공동주택관리비 정보제공서비스 (K-apt)
