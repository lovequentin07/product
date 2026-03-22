import fs from 'fs';
import path from 'path';

// 서울 25개 구 코드 (src/data/regions.ts 기준)
const regions = [
  { code: '11110', name: '종로구' },
  { code: '11170', name: '용산구' },
  { code: '11230', name: '동대문구' },
  { code: '11290', name: '성북구' },
  { code: '11320', name: '도봉구' },
  { code: '11350', name: '노원구' },
  { code: '11380', name: '은평구' },
  { code: '11410', name: '서대문구' },
  { code: '11440', name: '마포구' },
  { code: '11470', name: '양천구' },
  { code: '11500', name: '강서구' },
  { code: '11530', name: '구로구' },
  { code: '11545', name: '금천구' },
  { code: '11560', name: '영등포구' },
  { code: '11590', name: '동작구' },
  { code: '11620', name: '관악구' },
  { code: '11650', name: '서초구' },
  { code: '11680', name: '강남구' },
  { code: '11710', name: '송파구' },
  { code: '11740', name: '강동구' },
  { code: '11200', name: '성동구' },
  { code: '11215', name: '광진구' },
  { code: '11260', name: '중랑구' },
  { code: '11305', name: '강북구' },
  { code: '11140', name: '중구' }
];

/**
 * 특정 기간의 조합을 생성합니다.
 * @param startYear 시작 연도
 * @param durationYears 수집 기간(년)
 */
function generateCombinations(startYear: number, durationYears: number) {
  const combinations: any[] = [];

  for (const region of regions) {
    for (let year = startYear; year < startYear + durationYears; year++) {
      // 2026년일 경우 2월까지만 수집 (현재 시점 기준)
      const endMonth = (year === 2026) ? 2 : 12;
      
      for (let month = 1; month <= endMonth; month++) {
        const monthStr = month.toString().padStart(2, '0');
        combinations.push({
          regionCode: region.code,
          regionName: region.name,
          yearMonth: `${year}${monthStr}`,
          status: 'pending',
          attempt: 0
        });
      }
    }
  }

  const dirPath = path.join(process.cwd(), 'raw-data');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, 'combinations.json');
  fs.writeFileSync(filePath, JSON.stringify(combinations, null, 2));

  console.log(`\n[${startYear} ~ ${startYear + durationYears - 1}] 기간에 대한 ${combinations.length}개의 조합이 생성되었습니다.`);
  console.log(`저장 위치: ${filePath}`);
}

// 명령행 인자에서 시작 연도와 기간을 받아오거나 기본값 사용
const startYear = parseInt(process.argv[2]) || 2011;
const durationYears = parseInt(process.argv[3]) || 5;

generateCombinations(startYear, durationYears);
