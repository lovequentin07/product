-- src/data/migrate-v4.sql
-- 프로덕션 D1 마이그레이션: apt_meta 마스터 테이블 도입 (v3 → v4)
--
-- 실행 순서:
--   1. 이 파일을 wrangler d1 execute로 실행
--   2. npx tsx src/scripts/create-apt-meta.ts --remote 실행
--
-- 주의: ALTER TABLE은 재실행 시 에러 발생 (기존 컬럼 존재 시). 무시해도 됨.

-- ============================================================
-- 1. 새 테이블 생성 (없을 경우만)
-- ============================================================
CREATE TABLE IF NOT EXISTS apt_meta (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kapt_code       TEXT UNIQUE,
  apt_seq         TEXT UNIQUE,
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
  completion_date TEXT,
  household_cnt   INTEGER,
  building_cnt    INTEGER,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sgg_cd, umd_nm, apt_nm)
);

CREATE INDEX IF NOT EXISTS idx_apt_meta_kapt ON apt_meta(kapt_code);
CREATE INDEX IF NOT EXISTS idx_apt_meta_sgg  ON apt_meta(sgg_cd, umd_nm, apt_nm);

CREATE TABLE IF NOT EXISTS apt_name_alias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  apt_meta_id INTEGER NOT NULL REFERENCES apt_meta(id),
  source      TEXT NOT NULL,
  raw_apt_nm  TEXT NOT NULL,
  raw_sgg_nm  TEXT,
  raw_umd_nm  TEXT,
  UNIQUE(source, raw_apt_nm, raw_sgg_nm, raw_umd_nm)
);

-- ============================================================
-- 2. 테이블 이름 변경 (데이터 보존)
-- ============================================================
ALTER TABLE transactions RENAME TO apt_transactions;
ALTER TABLE mgmt_fee RENAME TO apt_mgmt_fee;

-- ============================================================
-- 3. FK 컬럼 추가 (nullable — 단계적 backfill)
-- ============================================================
ALTER TABLE apt_transactions ADD COLUMN apt_meta_id INTEGER REFERENCES apt_meta(id);
ALTER TABLE apt_mgmt_fee     ADD COLUMN apt_meta_id INTEGER REFERENCES apt_meta(id);

-- ============================================================
-- 4. 인덱스 추가
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_apt_txn_meta  ON apt_transactions(apt_meta_id);
CREATE INDEX IF NOT EXISTS idx_mgmt_fee_meta ON apt_mgmt_fee(apt_meta_id);

-- ============================================================
-- 완료 후: npx tsx src/scripts/create-apt-meta.ts --remote 실행
-- ============================================================
