import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getApartmentTransactions } from '../lib/api/apartment';

// .env.local 또는 .env 파일에서 환경 변수 로드
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const COMBINATIONS_PATH = path.join(process.cwd(), 'temp/raw-data/combinations.json');
const OUTPUT_PATH = path.join(process.cwd(), 'temp/raw-data/seoul_real_estate_2006_2010.jsonl');
const DELAY_MS = 500; // API 호출 간격 (0.5초)

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHistoricalData() {
  if (!fs.existsSync(COMBINATIONS_PATH)) {
    console.error('combinations.json 파일이 없습니다. 먼저 생성 스크립트를 실행하세요.');
    return;
  }

  const combinations = JSON.parse(fs.readFileSync(COMBINATIONS_PATH, 'utf-8'));
  const pendingItems = combinations.filter((item: any) => item.status === 'pending');

  console.log(`전체 ${combinations.length}개 중 ${pendingItems.length}개의 대기 항목을 처리합니다.`);

  for (let i = 0; i < pendingItems.length; i++) {
    const item = pendingItems[i];
    console.log(`[${i + 1}/${pendingItems.length}] 수집 중: ${item.regionName} (${item.regionCode}), ${item.yearMonth}`);

    try {
      // 한 번에 최대한 많이 가져오기 위해 numOfRows를 1000으로 설정
      const result = await getApartmentTransactions(item.regionCode, item.yearMonth, 1000, 1);

      if (result && result.transactions) {
        // 결과가 있으면 JSONL 파일에 추가
        for (const tx of result.transactions) {
          fs.appendFileSync(OUTPUT_PATH, JSON.stringify(tx) + '\n');
        }
        
        item.status = 'completed';
        item.count = result.transactions.length;
        console.log(`   -> 성공: ${result.transactions.length}건 저장 완료`);
      } else {
        // 결과가 비어있는 경우 (데이터가 없는 월일 수 있음)
        item.status = 'completed';
        item.count = 0;
        console.log(`   -> 완료: 데이터가 없습니다.`);
      }
    } catch (error) {
      item.status = 'error';
      console.error(`   -> 에러 발생:`, error);
    }

    // 상태 업데이트를 위해 combinations.json 저장
    fs.writeFileSync(COMBINATIONS_PATH, JSON.stringify(combinations, null, 2));

    // API 차단 방지를 위한 딜레이
    if (i < pendingItems.length - 1) {
      await sleep(DELAY_MS);
    }

    // 테스트를 위해 처음 5개만 진행
    if (i >= 4) {
      console.log('테스트를 위해 5개 항목만 처리하고 중단합니다.');
      break;
    }
  }

  console.log('수집 작업이 완료되었습니다.');
}

fetchHistoricalData();
