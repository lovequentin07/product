-- src/data/schema.sql
-- 아파트 실거래가 테이블 (v3: 시나리오 및 성능 최적화 버전)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- [원본 데이터]
  deal_amount INTEGER NOT NULL,      -- 원본 거래금액 (만원, 예: 145000)
  exclu_use_ar REAL NOT NULL,        -- 원본 전용면적 (㎡, 예: 84.95)
  
  -- [계산된 컬럼 - 조회/정렬/필터링 최적화]
  deal_amount_billion REAL,          -- 거래가격 (억 단위, 예: 14.5)
  area_pyeong INTEGER,               -- 면적 (평 단위, 정수, 예: 25)
  price_per_pyeong REAL,             -- 평당가격 (억 단위, 예: 0.56)
  
  -- [위치 및 아파트 정보]
  sgg_cd TEXT NOT NULL,              -- 시군구코드 (5자리)
  sgg_nm TEXT,                       -- 시군구명 (예: 송파구)
  umd_nm TEXT NOT NULL,              -- 법정동명 (예: 위례동)
  umd_cd TEXT,                       -- 법정동코드
  apt_nm TEXT NOT NULL,              -- 아파트명 (예: 포레나송파)
  jibun TEXT,                        -- 지번
  floor INTEGER,                     -- 층수
  build_year INTEGER,                -- 건축년도
  
  -- [날짜 및 시간 정보]
  deal_year INTEGER NOT NULL,
  deal_month INTEGER NOT NULL,
  deal_day INTEGER NOT NULL,
  deal_date TEXT NOT NULL,           -- 계약일자 (YYYY-MM-DD, 정렬용)
  
  -- [기타 및 해제 정보]
  cdeal_day TEXT,                    -- 해제일
  cdeal_type TEXT,                   -- 해제 여부/유형
  apt_seq TEXT,                      -- 아파트 일련번호 (단지 식별용)
  bonbun TEXT,                       -- 본번
  bubun TEXT,                        -- 부번
  road_nm TEXT,                      -- 도로명
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 성능 최적화를 위한 인덱스 설정
-- 1. 지역별/날짜별 기본 조회
CREATE INDEX IF NOT EXISTS idx_transactions_sgg_date ON transactions(sgg_cd, deal_date);
-- 2. 아파트 단지별 추이 분석 (시나리오 2)
CREATE INDEX IF NOT EXISTS idx_transactions_apt_nm ON transactions(apt_nm);
-- 3. 가성비/가격/평형 필터링 및 정렬 (시나리오 4)
CREATE INDEX IF NOT EXISTS idx_transactions_price_per_pyeong ON transactions(price_per_pyeong);
CREATE INDEX IF NOT EXISTS idx_transactions_amount_billion ON transactions(deal_amount_billion);
CREATE INDEX IF NOT EXISTS idx_transactions_area_pyeong ON transactions(area_pyeong);
-- 4. 특정 기간 대량 비교 (시나리오 3)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(deal_date);
