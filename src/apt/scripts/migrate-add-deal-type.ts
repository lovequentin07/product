/**
 * src/apt/scripts/migrate-add-deal-type.ts
 * D1 remote에 deal_type 관련 4개 컬럼을 ALTER TABLE로 추가합니다.
 *
 * 사용법:
 *   npx tsx --tsconfig tsconfig.json src/apt/scripts/migrate-add-deal-type.ts
 *
 * D1은 IF NOT EXISTS 지원 안 함 → 이미 컬럼이 있으면 에러 발생 (정상)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

const DB_NAME = 'apt-trade-db';
const TMP_FILE = (process.env.TEMP || process.env.TMP || '/tmp') + '/migrate_deal_type.sql';

// D1은 한 번에 ALTER TABLE 1개만 허용 → 4개 별도 실행
const alters = [
  "ALTER TABLE apt_transactions ADD COLUMN deal_type TEXT NOT NULL DEFAULT '매매';",
  "ALTER TABLE apt_transactions ADD COLUMN ownership_gbn TEXT;",
  "ALTER TABLE apt_transactions ADD COLUMN sler_gbn TEXT;",
  "ALTER TABLE apt_transactions ADD COLUMN buyer_gbn TEXT;",
];

function runSQL(sql: string): void {
  fs.writeFileSync(TMP_FILE, sql, 'utf-8');
  execSync(`npx wrangler d1 execute ${DB_NAME} --file "${TMP_FILE}" --remote`, { stdio: 'inherit' });
}

async function main() {
  for (const alter of alters) {
    console.log(`실행: ${alter}`);
    try {
      runSQL(alter);
      console.log('  완료');
    } catch (e) {
      const msg = String(e) + (e instanceof Error && 'stderr' in e ? String((e as NodeJS.ErrnoException & { stderr: Buffer }).stderr) : '');
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        console.log('  이미 존재 (무시)');
      } else {
        throw e;
      }
    }
  }

  console.log('\n마이그레이션 완료. 검증:');
  execSync(
    `npx wrangler d1 execute ${DB_NAME} --remote --command "SELECT deal_type, COUNT(*) as cnt FROM apt_transactions GROUP BY deal_type LIMIT 5"`,
    { stdio: 'inherit' }
  );
}

main().catch(err => { console.error(err); process.exit(1); });
