import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BASE_RAW_DATA_DIR = path.join(process.cwd(), 'raw-data');
const BASE_SPLIT_DATA_DIR = path.join(BASE_RAW_DATA_DIR, 'seoul');

// 파일의 라인 수를 세는 비동기 함수
async function countFileLines(filePath: string): Promise<number> {
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  let lineCount = 0;
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  for await (const line of rl) {
    if (line.trim()) {
      lineCount++;
    }
  }
  return lineCount;
}

async function verifyLocalFileCounts() {
  console.log('\n--- 로컬 파일간 건수 일치 검증 시작 ---');

  let totalRawCount = 0;
  let totalSplitCount = 0;
  let rawFilesProcessed = 0;

  // 1. raw-data/seoul_real_estate_XXXX_YYYY.jsonl 파일들의 총 라인 수 합계 계산
  const rawFileNames = [
    'seoul_real_estate_2006_2010.jsonl',
    'seoul_real_estate_2011_2015.jsonl',
    'seoul_real_estate_2016_2020.jsonl',
    'seoul_real_estate_2021_2026.jsonl',
  ];

  for (const fileName of rawFileNames) {
    const filePath = path.join(BASE_RAW_DATA_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const count = await countFileLines(filePath);
      console.log(`- 원본 파일 ${fileName}: ${count.toLocaleString()}건`);
      totalRawCount += count;
      rawFilesProcessed++;
    } else {
      console.warn(`- 경고: 원본 파일 ${filePath}을 찾을 수 없습니다. (스킵)`);
    }
  }

  console.log(`\n** 총 원본 파일 라인 수 합계: ${totalRawCount.toLocaleString()}건 (${rawFilesProcessed}개 파일) **`);

  // 2. raw-data/seoul/YYYY/YYYYMM.jsonl 파일들의 총 라인 수 합계 계산
  if (!fs.existsSync(BASE_SPLIT_DATA_DIR)) {
    console.error(`\n오류: 분할된 데이터 디렉토리 '${BASE_SPLIT_DATA_DIR}'를 찾을 수 없습니다.`);
    return;
  }

  const years = fs.readdirSync(BASE_SPLIT_DATA_DIR, { withFileTypes: true })
                  .filter(dirent => dirent.isDirectory())
                  .map(dirent => dirent.name);

  let splitFilesProcessed = 0;
  for (const year of years) {
    const yearDirPath = path.join(BASE_SPLIT_DATA_DIR, year);
    const months = fs.readdirSync(yearDirPath, { withFileTypes: true })
                     .filter(dirent => dirent.isFile() && dirent.name.endsWith('.jsonl'))
                     .map(dirent => dirent.name);

    for (const monthFile of months) {
      const filePath = path.join(yearDirPath, monthFile);
      const count = await countFileLines(filePath);
      totalSplitCount += count;
      splitFilesProcessed++;
    }
  }

  console.log(`\n** 총 분할된 파일 라인 수 합계: ${totalSplitCount.toLocaleString()}건 (${splitFilesProcessed}개 파일) **`);

  // 3. 최종 비교
  if (totalRawCount === totalSplitCount) {
    console.log(`\n✅ 로컬 파일간 건수 일치 검증 완료: 원본 파일 합계와 분할된 파일 합계가 정확히 일치합니다.`);
  } else {
    console.error(`\n❌ 로컬 파일간 건수 불일치!`);
    console.error(`   - 원본 파일 합계: ${totalRawCount.toLocaleString()}건`);
    console.error(`   - 분할된 파일 합계: ${totalSplitCount.toLocaleString()}건`);
  }
  console.log('--- 로컬 파일간 건수 일치 검증 완료 ---');
}

verifyLocalFileCounts();
