# 관리비 지킴이 개선 설계 스펙

**날짜**: 2026-04-06  
**범위**: `/apt-mgmt` 랜딩 페이지 FAQ + 결과 페이지 결과 섹션 리디자인

---

## 배경

아파트아이와 비교했을 때 우리 서비스의 핵심 약점은 **데이터를 직관적인 비유로 전달하지 못한다**는 점이다.  
현재 결과 페이지는 정보는 정확하지만 "상위 27%"처럼 좋은지 나쁜지 즉시 알 수 없는 언어, 바가 길수록 저렴하다는 반직관적 방향, 평형·가격 맥락 없이 전체 평균과 비교하는 구조 등 문제가 있다.

---

## 변경 1 — 랜딩 페이지: "만든 이유" 블록 추가

### 위치

`src/app/apt-mgmt/page.tsx` — 기존 `이런 분께 유용합니다` 섹션과 `FAQ` 섹션 사이

### 내용 (확정 카피)

```
우리 아파트 관리비, 비싼 걸까요?

매달 청구서를 받으면서도 알 수가 없었습니다.
같은 평형·가격대 단지들과 비교해서 답을 찾습니다.
```

### UI

- 섹션 레이블: `이 서비스를 만든 이유` (기존 FAQ 헤더와 동일 스타일: `text-xs font-semibold uppercase tracking-widest`)
- 카드 스타일: `var(--ds-cream-card)` 배경, `var(--ds-cream-border)` 테두리, `rounded-xl p-4`
- 폰트: `text-sm leading-relaxed`, `var(--ds-ink-muted)`
- 아이콘 없음

---

## 변경 2 — 결과 페이지: 결과 섹션 리디자인

### 대상 파일

- `src/apt-mgmt/components/AptMgmtSummaryCards.tsx` — 히어로 + 순위 바 교체
- `src/lib/db/management-fee.ts` (또는 결과 페이지 서버 컴포넌트) — 평형·거래가·유사 단지 데이터 추가 쿼리

### 2-1. 단지 프로필 칩 (히어로 상단)

현재 없음 → 아파트명 아래에 칩 3~4개 추가:

| 칩             | 데이터 출처                                                       | 없을 때 |
| -------------- | ----------------------------------------------------------------- | ------- |
| 🏠 N평 평균    | `apt_transactions.area_pyeong` 최근 12개월 평균 (`apt_meta.id = apt_transactions.apt_meta_id` join) | 칩 숨김 |
| 💰 N억 평균    | `apt_transactions.deal_amount_billion` 최근 12개월 평균 (동일 join)                                 | 칩 숨김 |
| 📅 YYYY년 준공 | `apt_meta.build_year`                                                                               | 칩 숨김 |
| 🏘️ N세대       | `apt_meta.household_cnt` (이미 result에 포함, 추가 쿼리 불필요)                                     | 칩 숨김 |

### 2-2. 히어로 판정 카드

기존 Tier 배지 + 월 X원 + 설명 텍스트 구조 유지하되:

- **판정 언어 변경**: "상위 27%" → **"비싼 편 · 서울 상위 27%"** (판정 우선, % 보조)
  - 절약 점수 ≥ 67 → "저렴한 편"(초록)
  - 절약 점수 40~66 → "보통"(amber)
  - 절약 점수 < 40 → "비싼 편"(빨강)
- **금액 차이 추가**: "서울 유사 조건 평균보다 월 +28,400원" 한 줄 서브텍스트

### 2-3. 서울 전체 — 건물 시각화 (신규)

기존 "순위 바 차트" 섹션을 교체.

**건물 4개** (왼쪽→오른쪽 = 저렴→비쌈):

| 건물      | 값                      | 색상                                      |
| --------- | ----------------------- | ----------------------------------------- |
| 가장 저렴 | 유사 조건 그룹 하위 10% | 초록 (`#dcfce7` / `#86efac`)              |
| 서울 평균 | 유사 조건 그룹 평균     | 회색 (`#f8fafc` / `#cbd5e1`)              |
| 우리 단지 | `total_per_hh`          | 빨강 (`#fef2f2` / `#f87171`), 강조 shadow |
| 가장 비쌈 | 유사 조건 그룹 상위 10% | 연한 빨강 (`#fff5f5` / `#fca5a5`)         |

- 건물 높이: 각 금액에 비례 (최고값 기준 정규화)
- 창문 디테일: 각 건물에 격자 패턴
- "우리 단지" 말풍선 레이블 상단 고정
- 하단: "유사 조건 단지 평균보다 월 +X원" 요약 문구

**유사 조건 정의**: 동일 `billing_ym` 기준, `area_pyeong ±5평` AND `deal_amount_billion ±5억`  
(거래 이력 없는 단지는 서울 전체 평균으로 fallback)

### 2-4. 구·동 — 게이지 바 (기존 바 차트 교체)

강남구, 대치동 각각 1행씩, 간결하게:

```
[강남구]  유사 조건 22개 단지        +14,000원
저렴 ━━━━━━━━━━━━╋━━━━━━━━ 비쌈
비교 그룹 평균 98,400원 · 상위 24%

[대치동]  유사 조건 5개 단지         +11,000원
저렴 ━━━━━━━━━━━━━━╋━━━━ 비쌈
비교 그룹 평균 101,400원 · 상위 20%
```

- 게이지: `linear-gradient(초록→amber→빨강)`, 흰 마커 바로 위치 표시
- 마커 위치: `rank / total * 100%`
- 동 단위 비교 그룹이 5개 미만이면 행 숨기고 구 단위만 표시

### 2-5. 이하 섹션 유지

`AptMgmtReportCards`, `AptMgmtCompareSection`, `AptMgmtShareButtons` — 변경 없음

---

## 데이터 요구사항

### 조인 전략

`apt_transactions`는 `apt_meta_id`(nullable)로 `apt_meta`와 연결됨. backfill이 완료된 단지는 `apt_meta_id`로 join, 미완료 단지는 `sgg_cd + apt_nm`으로 fallback.

```
apt_mgmt_fee.kapt_code
  → apt_meta.kapt_code (단지 메타)
  → apt_meta.id = apt_transactions.apt_meta_id (거래 이력)
```

### 신규 쿼리 (서버 컴포넌트에서 병렬 실행)

**쿼리 1 — 우리 단지 평형·거래가**

```sql
SELECT
  AVG(t.area_pyeong)         AS avg_pyeong,
  AVG(t.deal_amount_billion) AS avg_price
FROM apt_transactions t
JOIN apt_meta m ON m.kapt_code = ?        -- 우리 단지 kapt_code
WHERE t.apt_meta_id = m.id
  AND t.deal_type = '매매'
  AND t.deal_date >= date('now', '-12 months')
```

**쿼리 2 — 유사 조건 피어 그룹 통계 (서울·구·동)**

```sql
-- 1단계: 피어 그룹 kapt_code 목록 (평형·가격 조건)
SELECT DISTINCT m2.kapt_code
FROM apt_meta m2
JOIN apt_transactions t2 ON t2.apt_meta_id = m2.id
WHERE t2.deal_type = '매매'
  AND t2.deal_date >= date('now', '-12 months')
  -- 서울: sgg_nm 필터 없음 / 구: m2.sgg_nm = ? / 동: m2.umd_nm = ?
  AND t2.area_pyeong BETWEEN ? AND ?          -- 우리 avg_pyeong ±5평
  AND t2.deal_amount_billion BETWEEN ? AND ?  -- 우리 avg_price ±5억

-- 2단계: 피어 그룹 관리비 통계
SELECT
  COUNT(*)              AS peer_total,
  AVG(f.total_per_hh)  AS peer_avg,
  MIN(f.total_per_hh)  AS peer_min,
  MAX(f.total_per_hh)  AS peer_max
FROM apt_mgmt_fee f
WHERE f.kapt_code IN (/* 위 목록 */)
  AND f.billing_ym = ?                        -- 우리 단지와 동일 billing_ym
```

> **P10/P90**: D1(SQLite)에 PERCENTILE 없음 → 앱 레이어에서 결과 배열 정렬 후 인덱스로 계산.  
> **건물 높이 기준**: peer_min(최저 건물), peer_avg(평균 건물), our total_per_hh(우리 건물), peer_max(최고 건물). 최고값 기준 정규화 (max_height_px = 120px).

### Fallback 전략

| 상황                          | 처리                                                                      |
| ----------------------------- | ------------------------------------------------------------------------- |
| 거래 이력 없음 (신규 단지 등) | 평형·거래가 칩 숨김, 유사 조건 비교 건너뜀 → 기존 서울 전체 평균으로 표시 |
| 유사 조건 그룹 10개 미만      | 범위 확장 (±7평, ±8억) 재시도, 그래도 부족하면 전체 평균 표시             |
| 동 단위 그룹 5개 미만         | 동 게이지 행 숨김                                                         |

---

## 색상 토큰 (기존 디자인 시스템 준수)

```css
/* 기존 그대로 사용 */
--ds-cream-card, --ds-cream-border
--ds-ink, --ds-ink-muted, --ds-ink-faint
--ds-success-bg (#ECFDF5), #047857 (초록)
--ds-danger-bg (#fef2f2), #b91c1c (빨강)
```

건물 시각화 전용:

- 저렴 건물: `#dcfce7` fill / `#86efac` border
- 평균 건물: `#f8fafc` fill / `#cbd5e1` border
- 우리 건물: `#fef2f2` fill / `#f87171` border + `box-shadow: 0 0 16px rgba(239,68,68,0.15)`
- 최고 건물: `#fff5f5` fill / `#fca5a5` border

---

## 구현 순서

1. **랜딩 FAQ 위 "만든 이유" 블록** — `page.tsx` 수정, 5분
2. **단지 프로필 칩** — 평형·거래가 쿼리 추가, 결과 타입 확장
3. **히어로 판정 언어 변경** — `AptMgmtSummaryCards.tsx` 수정
4. **건물 시각화 컴포넌트** — 신규 `AptMgmtBuildingChart.tsx` 생성
5. **게이지 바 컴포넌트** — 기존 `RankBarRow` 교체
6. **유사 조건 쿼리** — `management-fee.ts` 확장
