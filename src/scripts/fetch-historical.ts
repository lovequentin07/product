import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getRawApartmentTransactions } from '../lib/api/apartment';

// .env.local 또는 .env 파일에서 환경 변수 로드
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const COMBINATIONS_PATH = path.join(process.cwd(), 'raw-data/combinations.json');
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'raw-data/seoul');
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
    const year = item.yearMonth.substring(0, 4);
    const month = item.yearMonth.substring(4, 6);
    
    // 저장 경로 설정: raw-data/seoul/YYYY/MM.jsonl
    const yearDir = path.join(BASE_OUTPUT_DIR, year);
    const filePath = path.join(yearDir, `${month}.jsonl`);

    console.log(`[${i + 1}/${pendingItems.length}] 수집 중: ${item.regionName} (${item.regionCode}), ${item.yearMonth}`);

    try {
      // 폴더가 없으면 생성
      if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
      }

      // 원천 데이터 가져오기 (모든 컬럼 포함)
      const result = await getRawApartmentTransactions(item.regionCode, item.yearMonth, 1000);

      if (result && result.transactions) {
        // 결과가 있으면 해당 월의 파일에 추가 (JSONL 형식)
        for (const tx of result.transactions) {
          fs.appendFileSync(filePath, JSON.stringify(tx) + '\n');
        }
        
        item.status = 'completed';
        item.count = result.transactions.length;
        console.log(`   -> 성공: ${result.transactions.length}건을 ${year}/${month}.jsonl에 저장 완료`);
      } else {
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
  }

  console.log('모든 수집 및 구조화 작업이 완료되었습니다.');
}

fetchHistoricalData();
