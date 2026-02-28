-- src/data/schema.sql
-- 아파트 실거래가 + 관리비 통합 스키마 (v4: apt_meta 마스터 테이블 도입)

-- ============================================================
-- apt_meta: 단지 마스터 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS apt_meta (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kapt_code       TEXT UNIQUE,       -- K-apt 코드 (apt_mgmt_fee 연결)
  apt_seq         TEXT UNIQUE,       -- 국토부 일련번호 (apt_transactions 연결)
  sgg_cd          TEXT NOT NULL,
  sgg_nm          TEXT NOT NULL,
  umd_nm          TEXT NOT NULL,
  umd_cd          TEXT,
  road_nm         TEXT,
  jibun           TEXT,
  bonbun          TEXT,
  bubun           TEXT,
  apt_nm          TEXT NOT NULL,
  build_year      INTEGER,
  completion_date TEXT,              -- YYYY-MM-DD
  household_cnt   INTEGER,
  building_cnt    INTEGER,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sgg_cd, umd_nm, apt_nm)
);

CREATE INDEX IF NOT EXISTS idx_apt_meta_kapt ON apt_meta(kapt_code);
CREATE INDEX IF NOT EXISTS idx_apt_meta_sgg  ON apt_meta(sgg_cd, umd_nm, apt_nm);

-- ============================================================
-- apt_name_alias: 표기 변형 매핑 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS apt_name_alias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  apt_meta_id INTEGER NOT NULL REFERENCES apt_meta(id),
  source      TEXT NOT NULL,   -- 'transactions' | 'mgmt_fee'
  raw_apt_nm  TEXT NOT NULL,
  raw_sgg_nm  TEXT,
  raw_umd_nm  TEXT,
  UNIQUE(source, raw_apt_nm, raw_sgg_nm, raw_umd_nm)
);

-- ============================================================
-- apt_transactions: 실거래가 테이블 (구 transactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS apt_transactions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  apt_meta_id         INTEGER REFERENCES apt_meta(id),  -- nullable (단계적 backfill)

  -- [원본 데이터]
  deal_amount         INTEGER NOT NULL,      -- 원본 거래금액 (만원)
  exclu_use_ar        REAL NOT NULL,         -- 원본 전용면적 (㎡)

  -- [계산된 컬럼 - 조회/정렬/필터링 최적화]
  deal_amount_billion REAL,                  -- 거래가격 (억 단위)
  area_pyeong         INTEGER,               -- 면적 (평 단위, 정수)
  price_per_pyeong    REAL,                  -- 평당가격 (억 단위)

  -- [위치 및 아파트 정보 — 쿼리 성능용 비정규화 잔류]
  sgg_cd              TEXT NOT NULL,         -- 시군구코드 (5자리)
  sgg_nm              TEXT,                  -- 시군구명
  umd_nm              TEXT NOT NULL,         -- 법정동명
  umd_cd              TEXT,                  -- 법정동코드
  apt_nm              TEXT NOT NULL,         -- 아파트명 (검색용 잔류)
  jibun               TEXT,                  -- 지번
  floor               INTEGER,               -- 층수
  build_year          INTEGER,               -- 건축년도

  -- [날짜 및 시간 정보]
  deal_year           INTEGER NOT NULL,
  deal_month          INTEGER NOT NULL,
  deal_day            INTEGER NOT NULL,
  deal_date           TEXT NOT NULL,         -- 계약일자 (YYYY-MM-DD, 정렬용)

  -- [기타 및 해제 정보]
  cdeal_day           TEXT,                  -- 해제일
  cdeal_type          TEXT,                  -- 해제 여부/유형
  apt_seq             TEXT,                  -- 아파트 일련번호
  bonbun              TEXT,                  -- 본번
  bubun               TEXT,                  -- 부번
  road_nm             TEXT,                  -- 도로명

  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apt_txn_sgg_date ON apt_transactions(sgg_cd, deal_date);
CREATE INDEX IF NOT EXISTS idx_apt_txn_apt_nm   ON apt_transactions(apt_nm);
CREATE INDEX IF NOT EXISTS idx_apt_txn_ppp      ON apt_transactions(price_per_pyeong);
CREATE INDEX IF NOT EXISTS idx_apt_txn_amount   ON apt_transactions(deal_amount_billion);
CREATE INDEX IF NOT EXISTS idx_apt_txn_area     ON apt_transactions(area_pyeong);
CREATE INDEX IF NOT EXISTS idx_apt_txn_date     ON apt_transactions(deal_date);
CREATE INDEX IF NOT EXISTS idx_apt_txn_meta     ON apt_transactions(apt_meta_id);

-- ============================================================
-- apt_mgmt_fee: 공동주택 관리비 테이블 (구 mgmt_fee)
-- ============================================================
CREATE TABLE IF NOT EXISTS apt_mgmt_fee (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  apt_meta_id INTEGER REFERENCES apt_meta(id),  -- nullable (단계적 backfill)
  kapt_code   TEXT NOT NULL,            -- 단지코드 (fallback 식별용 잔류)
  apt_nm      TEXT NOT NULL,            -- 단지명
  sido        TEXT NOT NULL,            -- 시도
  sgg_nm      TEXT NOT NULL,            -- 시군구
  umd_nm      TEXT,                     -- 동리
  billing_ym  TEXT NOT NULL,            -- 발생년월 (YYYYMM)

  -- 공용관리비 (H~Y열)
  common_mgmt_total   INTEGER DEFAULT 0,  -- 공용관리비계
  labor_cost          INTEGER DEFAULT 0,  -- 인건비
  office_cost         INTEGER DEFAULT 0,  -- 제사무비
  tax_fee             INTEGER DEFAULT 0,  -- 제세공과금
  clothing_cost       INTEGER DEFAULT 0,  -- 피복비
  training_cost       INTEGER DEFAULT 0,  -- 교육훈련비
  vehicle_cost        INTEGER DEFAULT 0,  -- 차량유지비
  other_overhead      INTEGER DEFAULT 0,  -- 그밖의부대비용
  cleaning_cost       INTEGER DEFAULT 0,  -- 청소비
  security_cost       INTEGER DEFAULT 0,  -- 경비비
  disinfection_cost   INTEGER DEFAULT 0,  -- 소독비
  elevator_cost       INTEGER DEFAULT 0,  -- 승강기유지비
  network_cost        INTEGER DEFAULT 0,  -- 지능형네트워크유지비
  repair_cost         INTEGER DEFAULT 0,  -- 수선비
  facility_cost       INTEGER DEFAULT 0,  -- 시설유지비
  safety_cost         INTEGER DEFAULT 0,  -- 안전점검비
  disaster_cost       INTEGER DEFAULT 0,  -- 재해예방비
  trust_mgmt_fee      INTEGER DEFAULT 0,  -- 위탁관리수수료

  -- 개별사용료 (Z~AQ열)
  indiv_usage_total   INTEGER DEFAULT 0,  -- 개별사용료계
  heating_common      INTEGER DEFAULT 0,  -- 난방비(공용)
  heating_indiv       INTEGER DEFAULT 0,  -- 난방비(전용)
  hot_water_common    INTEGER DEFAULT 0,  -- 급탕비(공용)
  hot_water_indiv     INTEGER DEFAULT 0,  -- 급탕비(전용)
  gas_common          INTEGER DEFAULT 0,  -- 가스사용료(공용)
  gas_indiv           INTEGER DEFAULT 0,  -- 가스사용료(전용)
  electricity_common  INTEGER DEFAULT 0,  -- 전기료(공용)
  electricity_indiv   INTEGER DEFAULT 0,  -- 전기료(전용)
  water_common        INTEGER DEFAULT 0,  -- 수도료(공용)
  water_indiv         INTEGER DEFAULT 0,  -- 수도료(전용)
  tv_fee              INTEGER DEFAULT 0,  -- TV수신료
  sewage_fee          INTEGER DEFAULT 0,  -- 정화조오물수수료
  waste_fee           INTEGER DEFAULT 0,  -- 생활폐기물수수료
  tenant_rep_cost     INTEGER DEFAULT 0,  -- 입대의운영비
  insurance_cost      INTEGER DEFAULT 0,  -- 건물보험료
  election_cost       INTEGER DEFAULT 0,  -- 선관위운영비
  other_indiv         INTEGER DEFAULT 0,  -- 기타

  -- 장기수선충당금 (AR~AU열)
  ltm_monthly_charge  INTEGER DEFAULT 0,  -- 장충금 월부과액
  ltm_monthly_use     INTEGER DEFAULT 0,  -- 장충금 월사용액
  ltm_total_reserve   INTEGER DEFAULT 0,  -- 장충금 총적립금액
  ltm_reserve_rate    REAL    DEFAULT 0,  -- 장충금 적립률
  misc_income         INTEGER DEFAULT 0,  -- 잡수입 월수입금액

  -- 세대 정보
  household_cnt       INTEGER,

  -- 사전계산: 세대당 평균 (원/세대/월)
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

CREATE INDEX IF NOT EXISTS idx_mgmt_fee_sgg_ym     ON apt_mgmt_fee(sgg_nm, billing_ym);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_kapt_ym    ON apt_mgmt_fee(kapt_code, billing_ym);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_rank       ON apt_mgmt_fee(sgg_nm, umd_nm, common_per_hh);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_apt_nm     ON apt_mgmt_fee(apt_nm);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_billing_ym ON apt_mgmt_fee(billing_ym);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_meta       ON apt_mgmt_fee(apt_meta_id);

-- ============================================================
-- apt_mgmt_fee_summary: 관리비 사전집계 요약 테이블
-- 매 billing_ym × (서울전체 / 구 / 동) 별 평균을 미리 계산
-- sentinel: sgg_nm='' AND umd_nm='' → 서울 전체
--           sgg_nm=<구> AND umd_nm='' → 구 단위
--           sgg_nm=<구> AND umd_nm=<동> → 동 단위
-- ============================================================
CREATE TABLE IF NOT EXISTS apt_mgmt_fee_summary (
  billing_ym TEXT NOT NULL,
  sgg_nm     TEXT NOT NULL,
  umd_nm     TEXT NOT NULL,
  cnt        INTEGER NOT NULL,
  -- 기존 14개 항목
  avg_total_per_hh        REAL,
  avg_common_per_hh       REAL,
  avg_security_per_hh     REAL,
  avg_cleaning_per_hh     REAL,
  avg_heating_per_hh      REAL,
  avg_electricity_per_hh  REAL,
  avg_water_per_hh        REAL,
  avg_ltm_per_hh          REAL,
  avg_labor_per_hh        REAL,
  avg_elevator_per_hh     REAL,
  avg_repair_per_hh       REAL,
  avg_trust_mgmt_per_hh   REAL,
  avg_hot_water_per_hh    REAL,
  avg_gas_per_hh          REAL,
  -- 신규 18개 항목
  avg_office_per_hh        REAL,
  avg_tax_per_hh           REAL,
  avg_clothing_per_hh      REAL,
  avg_training_per_hh      REAL,
  avg_vehicle_per_hh       REAL,
  avg_other_overhead_per_hh REAL,
  avg_disinfection_per_hh  REAL,
  avg_network_per_hh       REAL,
  avg_facility_per_hh      REAL,
  avg_safety_per_hh        REAL,
  avg_disaster_per_hh      REAL,
  avg_tv_per_hh            REAL,
  avg_sewage_per_hh        REAL,
  avg_waste_per_hh         REAL,
  avg_tenant_rep_per_hh    REAL,
  avg_insurance_per_hh     REAL,
  avg_election_per_hh      REAL,
  avg_other_indiv_per_hh   REAL,
  PRIMARY KEY (billing_ym, sgg_nm, umd_nm)
);
