/**
 * 매매 vs 분양권 건수 비교 (동일 지역, 동일 월)
 * npx tsx --tsconfig tsconfig.json src/apt/scripts/compare-trade-counts.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { callPublicDataApi } from '@shared/lib/api/client';
import { regions } from '@shared/data/regions';

const TRADE_PATH = '/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const SILV_PATH = '/RTMSDataSvcSilvTrade/getRTMSDataSvcSilvTrade';

async function getCount(path: string, lawdCd: string, yyyymm: string): Promise<number> {
  try {
    const res = await callPublicDataApi<{ response: { body: { totalCount: number } } }>(path, {
      LAWD_CD: lawdCd,
      DEAL_YMD: yyyymm,
      numOfRows: 1,
      pageNo: 1,
    });
    return res?.response?.body?.totalCount ?? 0;
  } catch {
    return -1; // API 오류
  }
}

async function main() {
  const MONTHS = ['202501', '202502', '202503'];
  const seoulRegions = regions.filter(r => r.parent === '서울특별시');

  console.log('\n=== 매매 vs 분양권 건수 비교 ===');
  console.log(`대상: 서울 ${seoulRegions.length}개 구, ${MONTHS.join(' / ')}\n`);

  let totalTrade = 0;
  let totalSilv = 0;

  for (const yyyymm of MONTHS) {
    let monthTrade = 0;
    let monthSilv = 0;
    const silvDetails: string[] = [];

    for (const region of seoulRegions) {
      const [trade, silv] = await Promise.all([
        getCount(TRADE_PATH, region.code, yyyymm),
        getCount(SILV_PATH, region.code, yyyymm),
      ]);
      monthTrade += trade > 0 ? trade : 0;
      monthSilv += silv > 0 ? silv : 0;
      if (silv > 0) silvDetails.push(`  ${region.name}: ${silv}건`);
    }

    const ratio = monthTrade > 0 ? ((monthSilv / monthTrade) * 100).toFixed(1) : '?';
    console.log(`[${yyyymm}] 매매: ${monthTrade.toLocaleString()}건 / 분양권+입주권: ${monthSilv.toLocaleString()}건 (비율: ${ratio}%)`);
    if (silvDetails.length > 0) {
      console.log('  분양권 있는 구:');
      silvDetails.forEach(d => console.log(d));
    } else {
      console.log('  (분양권 거래 없음)');
    }
    console.log('');

    totalTrade += monthTrade;
    totalSilv += monthSilv;
  }

  const totalRatio = totalTrade > 0 ? ((totalSilv / totalTrade) * 100).toFixed(1) : '?';
  console.log(`=== 3개월 합계 ===`);
  console.log(`매매: ${totalTrade.toLocaleString()}건`);
  console.log(`분양권+입주권: ${totalSilv.toLocaleString()}건`);
  console.log(`비율: ${totalRatio}%`);
}

main().catch(console.error);
