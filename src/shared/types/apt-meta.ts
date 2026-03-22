// src/types/apt-meta.ts
// 단지 마스터 테이블 타입 정의

export interface AptMeta {
  id: number;
  kapt_code: string | null;       // K-apt 코드
  apt_seq: string | null;         // 국토부 일련번호
  sgg_cd: string;
  sgg_nm: string;
  umd_nm: string;
  umd_cd: string | null;
  road_nm: string | null;
  jibun: string | null;
  bonbun: string | null;
  bubun: string | null;
  apt_nm: string;
  build_year: number | null;
  completion_date: string | null; // YYYY-MM-DD
  household_cnt: number | null;
  building_cnt: number | null;
  created_at: string;
  updated_at: string;
}

export interface AptNameAlias {
  id: number;
  apt_meta_id: number;
  source: 'transactions' | 'mgmt_fee';
  raw_apt_nm: string;
  raw_sgg_nm: string | null;
  raw_umd_nm: string | null;
}
