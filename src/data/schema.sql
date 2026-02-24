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

-- ============================================================
-- 공동주택 관리비 테이블 (K-apt 공시 데이터)
-- ============================================================
CREATE TABLE IF NOT EXISTS mgmt_fee (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kapt_code  TEXT NOT NULL,            -- E열: 단지코드
  apt_nm     TEXT NOT NULL,            -- F열: 단지명
  sido       TEXT NOT NULL,            -- A열: 시도
  sgg_nm     TEXT NOT NULL,            -- B열: 시군구
  umd_nm     TEXT,                     -- D열: 동리
  billing_ym TEXT NOT NULL,            -- G열: 발생년월(YYYYMM)

  -- 공용관리비 (H~Y열)
  common_mgmt_total   INTEGER DEFAULT 0,  -- H: 공용관리비계
  labor_cost          INTEGER DEFAULT 0,  -- I: 인건비
  office_cost         INTEGER DEFAULT 0,  -- J: 제사무비
  tax_fee             INTEGER DEFAULT 0,  -- K: 제세공과금
  clothing_cost       INTEGER DEFAULT 0,  -- L: 피복비
  training_cost       INTEGER DEFAULT 0,  -- M: 교육훈련비
  vehicle_cost        INTEGER DEFAULT 0,  -- N: 차량유지비
  other_overhead      INTEGER DEFAULT 0,  -- O: 그밖의부대비용
  cleaning_cost       INTEGER DEFAULT 0,  -- P: 청소비
  security_cost       INTEGER DEFAULT 0,  -- Q: 경비비
  disinfection_cost   INTEGER DEFAULT 0,  -- R: 소독비
  elevator_cost       INTEGER DEFAULT 0,  -- S: 승강기유지비
  network_cost        INTEGER DEFAULT 0,  -- T: 지능형네트워크유지비
  repair_cost         INTEGER DEFAULT 0,  -- U: 수선비
  facility_cost       INTEGER DEFAULT 0,  -- V: 시설유지비
  safety_cost         INTEGER DEFAULT 0,  -- W: 안전점검비
  disaster_cost       INTEGER DEFAULT 0,  -- X: 재해예방비
  trust_mgmt_fee      INTEGER DEFAULT 0,  -- Y: 위탁관리수수료

  -- 개별사용료 (Z~AQ열)
  indiv_usage_total   INTEGER DEFAULT 0,  -- Z: 개별사용료계
  heating_common      INTEGER DEFAULT 0,  -- AA: 난방비(공용)
  heating_indiv       INTEGER DEFAULT 0,  -- AB: 난방비(전용)
  hot_water_common    INTEGER DEFAULT 0,  -- AC: 급탕비(공용)
  hot_water_indiv     INTEGER DEFAULT 0,  -- AD: 급탕비(전용)
  gas_common          INTEGER DEFAULT 0,  -- AE: 가스사용료(공용)
  gas_indiv           INTEGER DEFAULT 0,  -- AF: 가스사용료(전용)
  electricity_common  INTEGER DEFAULT 0,  -- AG: 전기료(공용)
  electricity_indiv   INTEGER DEFAULT 0,  -- AH: 전기료(전용)
  water_common        INTEGER DEFAULT 0,  -- AI: 수도료(공용)
  water_indiv         INTEGER DEFAULT 0,  -- AJ: 수도료(전용)
  tv_fee              INTEGER DEFAULT 0,  -- AK: TV수신료
  sewage_fee          INTEGER DEFAULT 0,  -- AL: 정화조오물수수료
  waste_fee           INTEGER DEFAULT 0,  -- AM: 생활폐기물수수료
  tenant_rep_cost     INTEGER DEFAULT 0,  -- AN: 입대의운영비
  insurance_cost      INTEGER DEFAULT 0,  -- AO: 건물보험료
  election_cost       INTEGER DEFAULT 0,  -- AP: 선관위운영비
  other_indiv         INTEGER DEFAULT 0,  -- AQ: 기타

  -- 장기수선충당금 (AR~AU열)
  ltm_monthly_charge  INTEGER DEFAULT 0,  -- AR: 장충금 월부과액
  ltm_monthly_use     INTEGER DEFAULT 0,  -- AS: 장충금 월사용액
  ltm_total_reserve   INTEGER DEFAULT 0,  -- AT: 장충금 총적립금액
  ltm_reserve_rate    REAL    DEFAULT 0,  -- AU: 장충금 적립률
  misc_income         INTEGER DEFAULT 0,  -- AV: 잡수입 월수입금액

  -- 세대 정보 (API getAphusBassInfoV4로 보강)
  household_cnt       INTEGER,

  -- 사전계산: 세대당 평균 (원/세대/월) — 랭킹 핵심
  common_per_hh       INTEGER,           -- 세대당 공용관리비
  security_per_hh     INTEGER,           -- 세대당 경비비
  cleaning_per_hh     INTEGER,           -- 세대당 청소비
  heating_per_hh      INTEGER,           -- 세대당 난방비(공용+전용)
  electricity_per_hh  INTEGER,           -- 세대당 전기료(공용+전용)
  water_per_hh        INTEGER,           -- 세대당 수도료(공용+전용)
  ltm_per_hh          INTEGER,           -- 세대당 장충금 월부과액
  total_per_hh        INTEGER,           -- 세대당 총 관리비 합계

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kapt_code, billing_ym)
);

CREATE INDEX IF NOT EXISTS idx_mgmt_fee_sgg_ym    ON mgmt_fee(sgg_nm, billing_ym);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_kapt_ym   ON mgmt_fee(kapt_code, billing_ym);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_rank       ON mgmt_fee(sgg_nm, umd_nm, common_per_hh);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_apt_nm    ON mgmt_fee(apt_nm);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_billing_ym ON mgmt_fee(billing_ym);
