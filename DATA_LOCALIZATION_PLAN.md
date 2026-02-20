# 데이터 로컬라이징 및 하이브리드 업데이트 계획

## 배경 및 목적
- 공공데이터 API의 파라미터 제약(아파트명, 연월 필수) 해결
- 조회 성능 향상 및 자유로운 데이터 필터링(가격순, 면적순 등) 구현
- API 호출 횟수 최적화

## 1단계: 준비 및 브랜치 전략
- [x] 작업 브랜치 생성 (`feat/data-infrastructure`)
- [x] 데이터 수집용 정식 디렉토리 설정 (`raw-data/`) 및 `.gitignore` 확인

## 2단계: 데이터 벌크 다운로드 및 구조화
- [x] 파라미터 조합 생성 (`src/scripts/generate-combinations.ts`) 및 전체 조합 확보
- [x] 데이터 수집 스크립트 작성 (`src/scripts/fetch-historical.ts`)
- [x] 전체 기간(2006.01 ~ 2026.02) 서울 25개 구 데이터 수집 완료 (총 137만건, 237MB)
- [x] 수집된 단일 파일을 연월 단위로 분할 (`raw-data/seoul/YYYY/YYYYMM.jsonl`)

### 데이터 구조화 전략
- **경로:** `raw-data/seoul/YYYY/YYYYMM.jsonl`
- **장점:** 
    - 특정 월 데이터 업데이트 시 해당 파일만 교체(Overwrite) 가능
    - 조회 시 필요한 월의 데이터만 로드하여 성능 향상 및 메모리 절약
    - 데이터 관리 및 유실 위험 분산

---

## 🚀 남은 주요 작업

### 3단계: 데이터 분석 및 정합성 검증
- [x] **데이터 초기 정합성 검증 (랜덤 100개 샘플):**
    - [x] API 원천 데이터 vs 로컬 분할 JSONL 파일 (`raw-data/seoul/YYYY/YYYYMM.jsonl`)의 건수 및 내용 일치 여부 확인
- [x] **로컬 파일간 건수 일치 여부 확인:**
    - [x] `raw-data/seoul_real_estate_XXXX_YYYY.jsonl` 파일 총 라인 수 합계와 `raw-data/seoul/YYYY/YYYYMM.jsonl` 파일 총 라인 수 합계 비교
- [x] **데이터 품질 분석:** 분할된 데이터 유효성 검증 및 샘플 분석 (누락/중복/이상치 확인)
- [ ] **저장소 결정:** Cloudflare D1 (SQLite) vs R2 (Object Storage) vs 기타 옵션 최종 결정
- [ ] **데이터 스키마 설계:** 선택한 저장소에 맞는 테이블/객체 스키마 설계 (색인, 필드 타입 등)
- [ ] **비용 추산:** 선택한 저장소에 따른 예상 비용 (D1 Read/Write/Storage 등) 상세 추산

### 4단계: 증분 업데이트(Daily Sync) 구현
- [ ] **업데이트 전략:** 매일 아침 최신 월 데이터(전월/당월)를 API에서 가져와 `raw-data/seoul/YYYY/YYYYMM.jsonl` 파일 덮어쓰기 로직 구현
- [ ] **자동화 스케줄링:** GitHub Actions, Cloudflare Workers Cron Trigger 등을 이용한 자동화 설정
- [ ] **주기적 검증 프로세스:** 매일 업데이트 후, 주요 항목에 대한 자동 검증 및 알림 시스템 구축

### 5단계: API 레이어 교체 및 검증
- [ ] **데이터 조회 API 개발:** 기존 API 호출 로직을 로컬 `raw-data/` 파일 또는 D1 DB 조회 로직으로 전환
- [ ] **성능 최적화:** 로컬 데이터 기반 조회 API의 성능 최적화 및 캐싱 전략 수립
- [ ] **기능 테스트:** 기존 UI/기능이 정상적으로 작동하는지 통합 테스트
- [ ] **배포:** Cloudflare Pages/Workers 환경에 배포 및 실 서비스 전환
