import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';
import { getApartmentTransactions } from '../lib/api/apartment';
import { NormalizedTransaction } from '@/types/real-estate';

// .env.local 또는 .env 파일에서 환경 변수 로드
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const COMBINATIONS_PATH = path.join(process.cwd(), 'raw-data/combinations.json');
const BASE_DATA_DIR = path.join(process.cwd(), 'raw-data/seoul');
const SAMPLE_SIZE = 100; // 샘플 사이즈 100개
const DELAY_MS = 100; // API 호출 간격

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 로컬 파일에서 특정 regionCode와 yearMonth에 해당하는 모든 트랜잭션을 가져옵니다.
async function getLocalTransactionsForRegion(regionCode: string, year: string, yearMonth: string): Promise<NormalizedTransaction[]> {
  const filePath = path.join(BASE_DATA_DIR, year, `${yearMonth}.jsonl`);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const transactions: NormalizedTransaction[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const data: NormalizedTransaction = JSON.parse(line);
        // data.id 포맷: ${lawdCd}-${dealYmd}-${pageNo}-${index}
        // id에서 regionCode를 추출하여 필터링합니다.
        const idRegionCode = data.id.split('-')[0];
        if (idRegionCode === regionCode) {
          transactions.push(data);
        }
      } catch (e) {
        // 파싱 오류는 건너뜁니다.
      }
    }
  }
  return transactions;
}

async function verifyDataIntegrity() {
  if (!fs.existsSync(COMBINATIONS_PATH)) {
    console.error('combinations.json 파일이 없습니다. 먼저 생성 스크립트를 실행하세요.');
    return;
  }

  const allCombinations = JSON.parse(fs.readFileSync(COMBINATIONS_PATH, 'utf-8'));
  const verifiedCombinations = allCombinations.filter((item: any) => item.status === 'completed');

  if (verifiedCombinations.length === 0) {
    console.warn('완료된 조합이 없습니다. 검증할 데이터가 없습니다.');
    return;
  }

  // 무작위로 SAMPLE_SIZE 만큼 조합 추출
  const shuffledCombinations = verifiedCombinations.sort(() => 0.5 - Math.random());
  const sampleCombinations = shuffledCombinations.slice(0, SAMPLE_SIZE);

  console.log(`\n--- 데이터 정합성 검증 시작 (샘플 ${SAMPLE_SIZE}개 조합) ---`);
  let discrepanciesFound = 0;

  for (let i = 0; i < sampleCombinations.length; i++) {
    const item = sampleCombinations[i];
    const { regionName, regionCode, yearMonth } = item;
    const year = yearMonth.substring(0, 4);

    console.log(`[${i + 1}/${SAMPLE_SIZE}] 검증 중: ${regionName} (${regionCode}), ${yearMonth}`);

    try {
      // 1. API로부터 해당 조합의 모든 트랜잭션 가져오기
      const apiResult = await getApartmentTransactions(regionCode, yearMonth);
      if (!apiResult || !apiResult.transactions) {
        console.warn(`   -> 경고: API 호출 실패 또는 결과 없음. 스킵합니다.`);
        discrepanciesFound++;
        continue;
      }
      const apiTransactions = apiResult.transactions;
      const apiTotalCount = apiTransactions.length; // 실제 API에서 가져온 트랜잭션 건수

      // 2. 로컬 파일에서 해당 조합의 트랜잭션 가져오기
      const localTransactions = await getLocalTransactionsForRegion(regionCode, year, yearMonth);
      const localCount = localTransactions.length;

      // 3. 건수 비교
      if (apiTotalCount === localCount) {
        console.log(`   -> 건수 일치: API ${apiTotalCount}건, 로컬 ${localCount}건`);
        
        // 4. 내용 상세 비교 (ID를 기준으로 정렬 후 비교)
        const getTransactionId = (tx: NormalizedTransaction) => `${tx.aptName}-${tx.price}-${tx.area}-${tx.date}-${tx.floor}-${tx.buildYear}`;
        const sortedApiIds = apiTransactions.map(getTransactionId).sort();
        const sortedLocalIds = localTransactions.map(getTransactionId).sort();

        let contentMismatch = false;
        if (sortedApiIds.length !== sortedLocalIds.length) {
          contentMismatch = true;
        } else {
          for (let k = 0; k < sortedApiIds.length; k++) {
            if (sortedApiIds[k] !== sortedLocalIds[k]) {
              contentMismatch = true;
              break;
            }
          }
        }

        if (contentMismatch) {
          console.warn(`   -> 불일치 발견: 데이터 내용이 API와 로컬 파일 간에 다릅니다.`);
          discrepanciesFound++;
        } else {
          console.log(`   -> 내용 일치: API와 로컬 데이터 내용이 동일합니다.`);
        }

      } else {
        console.warn(`   -> 불일치 발견! 건수 불일치: API ${apiTotalCount}건, 로컬 ${localCount}건`);
        discrepanciesFound++;
      }

    } catch (error) {
      console.error(`   -> 에러 발생 (${regionName}, ${yearMonth}):`, error);
      discrepanciesFound++;
    }
    await sleep(DELAY_MS); // API 호출 간격 유지
  }

  console.log(`\n--- 데이터 정합성 검증 완료 ---`);
  if (discrepanciesFound === 0) {
    console.log(`✅ 모든 샘플 조합에서 정합성 문제가 발견되지 않았습니다.`);
  } else {
    console.error(`❌ 총 ${discrepanciesFound}개의 샘플 조합에서 정합성 문제가 발견되었습니다. 상세 로그를 확인하세요.`);
  }
}

verifyDataIntegrity();
