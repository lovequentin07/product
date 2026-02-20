# 데이터 로컬라이징 및 하이브리드 업데이트 계획

## 배경 및 목적
- 공공데이터 API의 파라미터 제약(아파트명, 연월 필수) 해결
- 조회 성능 향상 및 자유로운 데이터 필터링(가격순, 면적순 등) 구현
- API 호출 횟수 최적화

## 1단계: 준비 및 브랜치 전략
- [x] 작업 브랜치 생성 (`feat/data-infrastructure`)
- [x] 데이터 수집용 임시 디렉토리 설정 (`temp/raw-data`) 및 `.gitignore` 확인

## 2단계: 데이터 벌크 다운로드 (실험)
- [x] 파라미터 조합 생성 (`src/scripts/generate-combinations.ts`) 및 1,500개 조합 확보
- [ ] 데이터 수집 스크립트 작성 (`src/scripts/fetch-historical.ts`)
- [ ] 특정 지역(예: 서울시 특정 구) 1년치 데이터 샘플링 다운로드
- [ ] 전체 기간(5~10년) 데이터 다운로드 및 API Limit 확인

## 3단계: 데이터 분석 및 저장소 설계
- [ ] 다운로드된 파일 총 용량 확인
- [ ] 저장소 결정 (Cloudflare D1 vs R2 vs 기타)
- [ ] 데이터 스키마 설계 (필요한 필드만 추출하여 최적화)
- [ ] 비용 추산 (D1 Read/Write/Storage)

## 4단계: 증분 업데이트(Daily Sync) 구현
- [ ] GitHub Actions 또는 Cloudflare Triggers 스케줄링 설계
- [ ] 최신 데이터 Overwrite 로직 구현

## 5단계: API 레이어 교체 및 검증
- [ ] 기존 API 호출 로직을 로컬 DB 조회로 전환
- [ ] 기능 테스트 및 성능 비교
