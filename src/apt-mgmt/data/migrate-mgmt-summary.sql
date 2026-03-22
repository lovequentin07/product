-- migrate-mgmt-summary.sql
-- apt_mgmt_fee_summary 테이블 생성 + 데이터 집계
-- 실행: wrangler d1 execute apt-trade-db --remote --file=src/data/migrate-mgmt-summary.sql

DROP TABLE IF EXISTS apt_mgmt_fee_summary;

CREATE TABLE apt_mgmt_fee_summary (
  billing_ym TEXT NOT NULL,
  sgg_nm     TEXT NOT NULL,
  umd_nm     TEXT NOT NULL,
  cnt        INTEGER NOT NULL,
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

-- 서울 전체 (sgg_nm='', umd_nm='')
INSERT OR REPLACE INTO apt_mgmt_fee_summary
SELECT
  billing_ym, '', '', COUNT(*),
  AVG(total_per_hh),
  AVG(common_per_hh),
  AVG(security_per_hh),
  AVG(cleaning_per_hh),
  AVG(heating_per_hh),
  AVG(electricity_per_hh),
  AVG(water_per_hh),
  AVG(ltm_per_hh),
  AVG(CASE WHEN household_cnt > 0 THEN labor_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN elevator_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN repair_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN trust_mgmt_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN (hot_water_common + hot_water_indiv) * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN (gas_common + gas_indiv) * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN office_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tax_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN clothing_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN training_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN vehicle_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN other_overhead * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN disinfection_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN network_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN facility_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN safety_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN disaster_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tv_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN sewage_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN waste_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tenant_rep_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN insurance_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN election_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN other_indiv * 1.0 / household_cnt END)
FROM apt_mgmt_fee
WHERE sido = '서울특별시' AND total_per_hh > 0 AND household_cnt >= 10
GROUP BY billing_ym;

-- 구 단위 (sgg_nm=<구>, umd_nm='')
INSERT OR REPLACE INTO apt_mgmt_fee_summary
SELECT
  billing_ym, sgg_nm, '', COUNT(*),
  AVG(total_per_hh),
  AVG(common_per_hh),
  AVG(security_per_hh),
  AVG(cleaning_per_hh),
  AVG(heating_per_hh),
  AVG(electricity_per_hh),
  AVG(water_per_hh),
  AVG(ltm_per_hh),
  AVG(CASE WHEN household_cnt > 0 THEN labor_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN elevator_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN repair_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN trust_mgmt_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN (hot_water_common + hot_water_indiv) * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN (gas_common + gas_indiv) * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN office_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tax_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN clothing_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN training_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN vehicle_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN other_overhead * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN disinfection_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN network_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN facility_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN safety_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN disaster_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tv_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN sewage_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN waste_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tenant_rep_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN insurance_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN election_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN other_indiv * 1.0 / household_cnt END)
FROM apt_mgmt_fee
WHERE sido = '서울특별시' AND total_per_hh > 0 AND household_cnt >= 10
GROUP BY billing_ym, sgg_nm;

-- 동 단위 (sgg_nm=<구>, umd_nm=<동>)
INSERT OR REPLACE INTO apt_mgmt_fee_summary
SELECT
  billing_ym, sgg_nm, umd_nm, COUNT(*),
  AVG(total_per_hh),
  AVG(common_per_hh),
  AVG(security_per_hh),
  AVG(cleaning_per_hh),
  AVG(heating_per_hh),
  AVG(electricity_per_hh),
  AVG(water_per_hh),
  AVG(ltm_per_hh),
  AVG(CASE WHEN household_cnt > 0 THEN labor_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN elevator_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN repair_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN trust_mgmt_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN (hot_water_common + hot_water_indiv) * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN (gas_common + gas_indiv) * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN office_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tax_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN clothing_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN training_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN vehicle_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN other_overhead * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN disinfection_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN network_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN facility_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN safety_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN disaster_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tv_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN sewage_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN waste_fee * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN tenant_rep_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN insurance_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN election_cost * 1.0 / household_cnt END),
  AVG(CASE WHEN household_cnt > 0 THEN other_indiv * 1.0 / household_cnt END)
FROM apt_mgmt_fee
WHERE sido = '서울특별시' AND total_per_hh > 0 AND household_cnt >= 10 AND umd_nm IS NOT NULL
GROUP BY billing_ym, sgg_nm, umd_nm;
