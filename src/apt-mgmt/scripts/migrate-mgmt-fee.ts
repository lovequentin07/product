/**
 * src/scripts/migrate-mgmt-fee.ts
 * K-apt 관리비 Excel 데이터를 Cloudflare D1으로 적재하는 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx src/scripts/migrate-mgmt-fee.ts
 *
 * 특징:
 *   - OOXML sheet1.xml 스트리밍 파싱 (720MB XML → 메모리 효율)
 *   - unzip -p 파이프 + 라인별 정규식 파싱
 *   - 서울특별시만 필터링
 *   - 배치 500건, INSERT OR IGNORE로 재실행 안전
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync, spawn } from 'child_process';

// -------------------------
// 설정
// -------------------------
const EXCEL_FILE = path.join(process.cwd(), '.claude/data_source/20260220_단지_관리비정보.xlsx');
const BATCH_SIZE = 200;
const TMP_SQL_FILE = '/tmp/mgmt_fee_batch.sql';
const DB_NAME = 'apt-trade-db';

// -------------------------
// OOXML 파싱 유틸
// -------------------------

/** HTML 엔티티 디코드 (&#NNNN; 형식) */
function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** 열 문자(A, B, ... Z, AA, AB, ...) → 0-based 인덱스 */
function colLetterToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

/** 셀 참조(A1, B2, AA3 ...) → 0-based 열 인덱스 */
function cellRefToColIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, '');
  return colLetterToIndex(letters);
}

/**
 * XML 행(row) 문자열에서 셀 배열 추출
 * 셀 형식:
 *   inlineStr: <c r="AN" ...><is><t>TEXT</t></is></c>
 *   numeric:   <c r="AN"><v>12345</v></c>
 *   empty:     <c r="AN"/>  또는  <c r="AN"></c>
 */
function parseRow(rowXml: string): string[] {
  const cells: { col: number; val: string }[] = [];

  // 모든 <c r="..."...>...</c> 매칭 (greedy하지 않게)
  const cellRe = /<c\s+r="([A-Z]+\d+)"[^>]*>([\s\S]*?)<\/c>|<c\s+r="([A-Z]+\d+)"[^>]*\/>/g;
  let m: RegExpExecArray | null;

  while ((m = cellRe.exec(rowXml)) !== null) {
    const ref = m[1] || m[3];
    const inner = m[2] || '';
    const col = cellRefToColIndex(ref);

    let val = '';
    if (inner) {
      // inlineStr: <is><t>...</t></is>
      const isMatch = /<t>([\s\S]*?)<\/t>/.exec(inner);
      if (isMatch) {
        val = decodeEntities(isMatch[1]);
      } else {
        // numeric: <v>...</v>
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (vMatch) val = vMatch[1].trim();
      }
    }

    cells.push({ col, val });
  }

  // 최대 열 인덱스
  const maxCol = cells.length > 0 ? Math.max(...cells.map((c) => c.col)) : -1;
  const arr: string[] = new Array(maxCol + 1).fill('');
  for (const c of cells) {
    arr[c.col] = c.val;
  }
  return arr;
}

// -------------------------
// COL 인덱스 매핑 (0-based)
// -------------------------
const COL = {
  sido: 0, sgg_nm: 1, eup_myeon: 2, umd_nm: 3,
  kapt_code: 4, apt_nm: 5, billing_ym: 6,
  common_mgmt_total: 7,
  labor_cost: 8, office_cost: 9, tax_fee: 10, clothing_cost: 11,
  training_cost: 12, vehicle_cost: 13, other_overhead: 14,
  cleaning_cost: 15, security_cost: 16, disinfection_cost: 17,
  elevator_cost: 18, network_cost: 19, repair_cost: 20,
  facility_cost: 21, safety_cost: 22, disaster_cost: 23, trust_mgmt_fee: 24,
  indiv_usage_total: 25,
  heating_common: 26, heating_indiv: 27, hot_water_common: 28,
  hot_water_indiv: 29, gas_common: 30, gas_indiv: 31,
  electricity_common: 32, electricity_indiv: 33,
  water_common: 34, water_indiv: 35,
  tv_fee: 36, sewage_fee: 37, waste_fee: 38, tenant_rep_cost: 39,
  insurance_cost: 40, election_cost: 41, other_indiv: 42,
  ltm_monthly_charge: 43, ltm_monthly_use: 44,
  ltm_total_reserve: 45, ltm_reserve_rate: 46, misc_income: 47,
};

// -------------------------
// 값 파싱 유틸
// -------------------------
function safeInt(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

function safeReal(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function escapeSql(val: string): string {
  return val.replace(/'/g, "''");
}

function billingYmStr(val: string): string {
  return val.replace('-', '').trim().substring(0, 6);
}

// -------------------------
// D1 배치 실행 (multi-row INSERT — D1 remote는 BEGIN TRANSACTION 미지원)
// -------------------------
const INSERT_COLS = `(kapt_code, apt_nm, sido, sgg_nm, umd_nm, billing_ym,
  common_mgmt_total, labor_cost, office_cost, tax_fee, clothing_cost,
  training_cost, vehicle_cost, other_overhead, cleaning_cost, security_cost,
  disinfection_cost, elevator_cost, network_cost, repair_cost, facility_cost,
  safety_cost, disaster_cost, trust_mgmt_fee,
  indiv_usage_total, heating_common, heating_indiv, hot_water_common, hot_water_indiv,
  gas_common, gas_indiv, electricity_common, electricity_indiv,
  water_common, water_indiv, tv_fee, sewage_fee, waste_fee,
  tenant_rep_cost, insurance_cost, election_cost, other_indiv,
  ltm_monthly_charge, ltm_monthly_use, ltm_total_reserve, ltm_reserve_rate, misc_income)`;

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runBatch(valueRows: string[], attempt = 1): void {
  // 개별 INSERT 문 (multi-row VALUES가 SQLITE_TOOBIG 발생 → 개별로)
  const stmts = valueRows.map(
    (v) => `INSERT OR IGNORE INTO apt_mgmt_fee ${INSERT_COLS} VALUES ${v};`
  );
  const sql = stmts.join('\n');
  fs.writeFileSync(TMP_SQL_FILE, sql, 'utf-8');
  try {
    execSync(`npx wrangler d1 execute ${DB_NAME} --file ${TMP_SQL_FILE} --remote`, {
      stdio: 'inherit',
    });
  } catch (e) {
    if (attempt >= 3) throw e;
    console.warn(`\n⚠️  배치 실패 (시도 ${attempt}/3), 5초 후 재시도...`);
    sleep(5000);
    runBatch(valueRows, attempt + 1);
  }
}

// -------------------------
// 메인
// -------------------------
async function main() {
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ 파일 없음: ${EXCEL_FILE}`);
    process.exit(1);
  }

  console.log('📂 OOXML 스트리밍 파싱 시작...');
  console.log('   (720MB XML → unzip -p 스트리밍)');

  let batch: string[] = [];
  let totalInserted = 0;
  let totalSkipped = 0;
  let rowNum = 0;  // XML 행 번호 (1-based, row r 속성)

  // unzip -p로 sheet1.xml 스트리밍
  const unzipProc = spawn('unzip', ['-p', EXCEL_FILE, 'xl/worksheets/sheet1.xml'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const rl = readline.createInterface({
    input: unzipProc.stdout,
    crlfDelay: Infinity,
  });

  let pendingRowNum = -1;  // 바로 앞 줄에서 읽은 row 번호

  await new Promise<void>((resolve, reject) => {
    rl.on('line', (line) => {
      // <row r="N"> 태그 → 다음 줄이 셀들
      const rowOpenMatch = /^<row r="(\d+)">$/.exec(line.trim());
      if (rowOpenMatch) {
        pendingRowNum = parseInt(rowOpenMatch[1], 10);
        return;
      }

      // 셀 데이터 줄 (pendingRowNum이 설정되어 있을 때)
      if (pendingRowNum < 0) return;
      rowNum = pendingRowNum;
      pendingRowNum = -1;

      // Row 1 (공지), Row 2 (헤더) skip
      if (rowNum <= 2) return;

      const cols = parseRow(line);
      const sido = cols[COL.sido]?.trim() ?? '';

      // 서울만
      if (!sido.startsWith('서울')) {
        totalSkipped++;
        return;
      }

      const sgg_nm = cols[COL.sgg_nm]?.trim() ?? '';
      const umd_nm = cols[COL.umd_nm]?.trim() ?? '';
      const kapt_code = cols[COL.kapt_code]?.trim() ?? '';
      const apt_nm = cols[COL.apt_nm]?.trim() ?? '';
      const billing_ym = billingYmStr(cols[COL.billing_ym] ?? '');

      if (!kapt_code || !apt_nm || !billing_ym) {
        totalSkipped++;
        return;
      }

      // VALUES 튜플 (multi-row INSERT용)
      const sql = `('${escapeSql(kapt_code)}','${escapeSql(apt_nm)}','${escapeSql(sido)}','${escapeSql(sgg_nm)}','${escapeSql(umd_nm)}','${billing_ym}',${safeInt(cols[COL.common_mgmt_total])},${safeInt(cols[COL.labor_cost])},${safeInt(cols[COL.office_cost])},${safeInt(cols[COL.tax_fee])},${safeInt(cols[COL.clothing_cost])},${safeInt(cols[COL.training_cost])},${safeInt(cols[COL.vehicle_cost])},${safeInt(cols[COL.other_overhead])},${safeInt(cols[COL.cleaning_cost])},${safeInt(cols[COL.security_cost])},${safeInt(cols[COL.disinfection_cost])},${safeInt(cols[COL.elevator_cost])},${safeInt(cols[COL.network_cost])},${safeInt(cols[COL.repair_cost])},${safeInt(cols[COL.facility_cost])},${safeInt(cols[COL.safety_cost])},${safeInt(cols[COL.disaster_cost])},${safeInt(cols[COL.trust_mgmt_fee])},${safeInt(cols[COL.indiv_usage_total])},${safeInt(cols[COL.heating_common])},${safeInt(cols[COL.heating_indiv])},${safeInt(cols[COL.hot_water_common])},${safeInt(cols[COL.hot_water_indiv])},${safeInt(cols[COL.gas_common])},${safeInt(cols[COL.gas_indiv])},${safeInt(cols[COL.electricity_common])},${safeInt(cols[COL.electricity_indiv])},${safeInt(cols[COL.water_common])},${safeInt(cols[COL.water_indiv])},${safeInt(cols[COL.tv_fee])},${safeInt(cols[COL.sewage_fee])},${safeInt(cols[COL.waste_fee])},${safeInt(cols[COL.tenant_rep_cost])},${safeInt(cols[COL.insurance_cost])},${safeInt(cols[COL.election_cost])},${safeInt(cols[COL.other_indiv])},${safeInt(cols[COL.ltm_monthly_charge])},${safeInt(cols[COL.ltm_monthly_use])},${safeInt(cols[COL.ltm_total_reserve])},${safeReal(cols[COL.ltm_reserve_rate])},${safeInt(cols[COL.misc_income])})`;

      batch.push(sql);
      totalInserted++;

      if (batch.length >= BATCH_SIZE) {
        // readline을 일시 정지하고 배치 실행
        rl.pause();
        process.stdout.write(`\r  배치 실행... 행 ${rowNum}, ${totalInserted}건 처리됨`);
        runBatch(batch);
        batch = [];
        rl.resume();
      }
    });

    rl.on('close', () => resolve());
    rl.on('error', reject);
    unzipProc.on('error', reject);
    unzipProc.stderr.on('data', (d: Buffer) => {
      const msg = d.toString();
      if (msg.trim()) console.error('unzip stderr:', msg);
    });
  });

  // 남은 배치
  if (batch.length > 0) {
    process.stdout.write(`\r  배치 실행... 최종 ${totalInserted}건 처리됨`);
    runBatch(batch);
  }

  console.log(`\n✅ 완료: ${totalInserted}건 INSERT, ${totalSkipped}건 skip`);
  console.log('👉 다음 단계: npx tsx src/scripts/enrich-mgmt-fee.ts');
}

main().catch((err) => {
  console.error('❌ 오류:', err);
  process.exit(1);
});
