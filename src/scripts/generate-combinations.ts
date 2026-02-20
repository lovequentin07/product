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
  { code: '11140', name: '중구' } // 누락된 중구 추가
];

const startYear = 2006;
const durationYears = 5;
const combinations: any[] = [];

for (const region of regions) {
  for (let year = startYear; year < startYear + durationYears; year++) {
    for (let month = 1; month <= 12; month++) {
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

const dirPath = path.join(process.cwd(), 'temp/raw-data');
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const filePath = path.join(dirPath, 'combinations.json');
fs.writeFileSync(filePath, JSON.stringify(combinations, null, 2));

console.log(`총 ${combinations.length}개의 조합이 생성되어 ${filePath}에 저장되었습니다.`);
