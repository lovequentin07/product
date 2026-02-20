import fs from 'fs';
import path from 'path';
import readline from 'readline';

const INPUT_PATH = path.join(process.cwd(), 'raw-data/seoul_real_estate_2021_2026.jsonl');
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'raw-data/seoul');

async function splitData() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error('원본 데이터 파일이 없습니다.');
    return;
  }

  const fileStream = fs.createReadStream(INPUT_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  const yearMonthSet = new Set<string>();

  console.log('데이터 분할 작업을 시작합니다...');

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const data = JSON.parse(line);
      
      // 원천 데이터 필드(dealYear, dealMonth) 사용
      const year = String(data.dealYear);
      const month = String(data.dealMonth).padStart(2, '0');
      const yearMonth = `${year}${month}`;
      
      const yearDir = path.join(BASE_OUTPUT_DIR, year);
      const outputFile = path.join(yearDir, `${yearMonth}.jsonl`);

      if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
      }

      fs.appendFileSync(outputFile, line + "\n");
      
      yearMonthSet.add(yearMonth);
      count++;

      if (count % 50000 === 0) {
        console.log(`... ${count.toLocaleString()}건 처리 중`);
      }
    } catch (e) {
      // 파싱 실패한 줄은 건너뜁니다.
    }
  }

  console.log('\n데이터 분할 완료!');
  console.log(`- 총 처리 건수: ${count.toLocaleString()}건`);
  console.log(`- 생성된 월별 파일 수: ${yearMonthSet.size}개`);
  console.log(`- 저장 위치: ${BASE_OUTPUT_DIR}`);
}

splitData();
