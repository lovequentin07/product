// src/lib/db/apt-meta.ts
// 단지 마스터 테이블 조회 함수

import { AptMeta } from '@/types/apt-meta';

// -------------------------
// Mock 데이터 (로컬 개발용)
// -------------------------
export const MOCK_APT_META: AptMeta[] = [
  {
    id: 1,
    kapt_code: 'A10001000',
    apt_seq: null,
    sgg_cd: '11680',
    sgg_nm: '강남구',
    umd_nm: '대치동',
    umd_cd: null,
    road_nm: '삼성로',
    jibun: '316',
    bonbun: null,
    bubun: null,
    apt_nm: '래미안대치팰리스',
    build_year: 2015,
    completion_date: null,
    household_cnt: 500,
    building_cnt: null,
    created_at: '2026-02-25T00:00:00',
    updated_at: '2026-02-25T00:00:00',
  },
  {
    id: 2,
    kapt_code: 'A10001001',
    apt_seq: null,
    sgg_cd: '11680',
    sgg_nm: '강남구',
    umd_nm: '대치동',
    umd_cd: null,
    road_nm: null,
    jibun: '316',
    bonbun: null,
    bubun: null,
    apt_nm: '은마아파트',
    build_year: 1979,
    completion_date: null,
    household_cnt: 4424,
    building_cnt: null,
    created_at: '2026-02-25T00:00:00',
    updated_at: '2026-02-25T00:00:00',
  },
  {
    id: 3,
    kapt_code: 'A10001002',
    apt_seq: null,
    sgg_cd: '11680',
    sgg_nm: '강남구',
    umd_nm: '도곡동',
    umd_cd: null,
    road_nm: '언주로',
    jibun: '467',
    bonbun: null,
    bubun: null,
    apt_nm: '타워팰리스',
    build_year: 2002,
    completion_date: null,
    household_cnt: 2600,
    building_cnt: null,
    created_at: '2026-02-25T00:00:00',
    updated_at: '2026-02-25T00:00:00',
  },
  {
    id: 4,
    kapt_code: 'A10001003',
    apt_seq: null,
    sgg_cd: '11680',
    sgg_nm: '강남구',
    umd_nm: '개포동',
    umd_cd: null,
    road_nm: null,
    jibun: '12',
    bonbun: null,
    bubun: null,
    apt_nm: '개포주공',
    build_year: 1982,
    completion_date: null,
    household_cnt: 1140,
    building_cnt: null,
    created_at: '2026-02-25T00:00:00',
    updated_at: '2026-02-25T00:00:00',
  },
  {
    id: 5,
    kapt_code: 'A10001004',
    apt_seq: null,
    sgg_cd: '11680',
    sgg_nm: '강남구',
    umd_nm: '삼성동',
    umd_cd: null,
    road_nm: null,
    jibun: null,
    bonbun: null,
    bubun: null,
    apt_nm: '삼성현대',
    build_year: null,
    completion_date: null,
    household_cnt: null,
    building_cnt: null,
    created_at: '2026-02-25T00:00:00',
    updated_at: '2026-02-25T00:00:00',
  },
];

// -------------------------
// D1 쿼리
// -------------------------

async function getD1AptMeta(db: D1Database, id: number): Promise<AptMeta | null> {
  return db.prepare('SELECT * FROM apt_meta WHERE id = ?').bind(id).first<AptMeta>();
}

async function getD1AptMetaByKaptCode(db: D1Database, kapt_code: string): Promise<AptMeta | null> {
  return db.prepare('SELECT * FROM apt_meta WHERE kapt_code = ?').bind(kapt_code).first<AptMeta>();
}

async function getD1AptMetaByAptSeq(db: D1Database, apt_seq: string): Promise<AptMeta | null> {
  return db.prepare('SELECT * FROM apt_meta WHERE apt_seq = ?').bind(apt_seq).first<AptMeta>();
}

async function getD1AptMetaByAddress(
  db: D1Database,
  sgg_cd: string,
  umd_nm: string,
  apt_nm: string
): Promise<AptMeta | null> {
  return db
    .prepare('SELECT * FROM apt_meta WHERE sgg_cd = ? AND umd_nm = ? AND apt_nm = ? LIMIT 1')
    .bind(sgg_cd, umd_nm, apt_nm)
    .first<AptMeta>();
}

// -------------------------
// 공개 API
// -------------------------

async function getDb(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext();
    return (env as unknown as { DB: D1Database }).DB ?? null;
  } catch {
    return null;
  }
}

export async function getAptMeta(id: number): Promise<AptMeta | null> {
  const db = await getDb();
  if (!db) return MOCK_APT_META.find((m) => m.id === id) ?? null;
  return getD1AptMeta(db, id);
}

export async function getAptMetaByKaptCode(kapt_code: string): Promise<AptMeta | null> {
  const db = await getDb();
  if (!db) return MOCK_APT_META.find((m) => m.kapt_code === kapt_code) ?? null;
  return getD1AptMetaByKaptCode(db, kapt_code);
}

export async function getAptMetaByAptSeq(apt_seq: string): Promise<AptMeta | null> {
  const db = await getDb();
  if (!db) return MOCK_APT_META.find((m) => m.apt_seq === apt_seq) ?? null;
  return getD1AptMetaByAptSeq(db, apt_seq);
}

export async function getAptMetaByAddress(
  sgg_cd: string,
  umd_nm: string,
  apt_nm: string
): Promise<AptMeta | null> {
  const db = await getDb();
  if (!db)
    return (
      MOCK_APT_META.find(
        (m) => m.sgg_cd === sgg_cd && m.umd_nm === umd_nm && m.apt_nm === apt_nm
      ) ?? null
    );
  return getD1AptMetaByAddress(db, sgg_cd, umd_nm, apt_nm);
}
