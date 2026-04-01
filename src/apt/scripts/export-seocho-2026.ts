import { config } from 'dotenv';
config({ path: '.env.local' });
import { getRawApartmentTransactions } from '@apt/lib/api/apartment';
import * as fs from 'fs';

async function main() {
  const all: any[] = [];
  for (const yyyymm of ['202508']) {
    const result = await getRawApartmentTransactions('11650', yyyymm, 1000);
    if (result) all.push(...result.transactions);
    console.log(yyyymm, 'totalCount:', result?.totalCount, '/ 실제 수집:', result?.transactions.length ?? 0, '건');
  }
  const header = 'aptNm,dealAmount,dealYear,dealMonth,dealDay,floor,excluUseAr,umdNm,buildYear';
  const rows = all.map(r =>
    [r.aptNm, r.dealAmount, r.dealYear, r.dealMonth, r.dealDay, r.floor, r.excluUseAr, r.umdNm, r.buildYear].join(',')
  );
  fs.writeFileSync('seocho_2026.csv', header + '\n' + rows.join('\n'), 'utf8');
  console.log('저장 완료:', all.length, '건 → seocho_2026.csv');
}
main().catch(console.error);
