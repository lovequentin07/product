// src/data/regions.ts

export interface Region {
  code: string;
  name: string;
  parent?: string; // Optional parent region name (e.g., '서울특별시')
}

// 초기 개발을 위한 주요 지역 법정동 코드 목록입니다.
// 실제 서비스에서는 전체 법정동 코드 데이터를 연동하여 사용할 수 있습니다.
export const regions: Region[] = [
  // 서울특별시 (Seoul)
  { code: '11000', name: '서울특별시', parent: '' },
  { code: '11110', name: '종로구', parent: '서울특별시' },
  { code: '11170', name: '용산구', parent: '서울특별시' },
  { code: '11230', name: '동대문구', parent: '서울특별시' },
  { code: '11290', name: '성북구', parent: '서울특별시' },
  { code: '11320', name: '도봉구', parent: '서울특별시' },
  { code: '11350', name: '노원구', parent: '서울특별시' },
  { code: '11380', name: '은평구', parent: '서울특별시' },
  { code: '11410', name: '서대문구', parent: '서울특별시' },
  { code: '11440', name: '마포구', parent: '서울특별시' },
  { code: '11470', name: '양천구', parent: '서울특별시' },
  { code: '11500', name: '강서구', parent: '서울특별시' },
  { code: '11530', name: '구로구', parent: '서울특별시' },
  { code: '11545', name: '금천구', parent: '서울특별시' },
  { code: '11560', name: '영등포구', parent: '서울특별시' },
  { code: '11590', name: '동작구', parent: '서울특별시' },
  { code: '11620', name: '관악구', parent: '서울특별시' },
  { code: '11650', name: '서초구', parent: '서울특별시' },
  { code: '11680', name: '강남구', parent: '서울특별시' },
  { code: '11710', name: '송파구', parent: '서울특별시' },
  { code: '11740', name: '강동구', parent: '서울특별시' },
  { code: '11200', name: '성동구', parent: '서울특별시' },
  { code: '11215', name: '광진구', parent: '서울특별시' },
  { code: '11260', name: '중랑구', parent: '서울특별시' },
  { code: '11305', name: '강북구', parent: '서울특별시' },
  /*
  // 경기도 (Gyeonggi-do) - 일부 추가
  { code: '41000', name: '경기도', parent: '' },
  { code: '41110', name: '수원시', parent: '경기도' },
  { code: '41130', name: '성남시', parent: '경기도' },
  { code: '41170', name: '의정부시', parent: '경기도' },
  { code: '41190', name: '안양시', parent: '경기도' },
  { code: '41210', name: '부천시', parent: '경기도' },
  { code: '41270', name: '안산시', parent: '경기도' },
  { code: '41280', name: '고양시', parent: '경기도' },
  { code: '41360', name: '남양주시', parent: '경기도' },
  { code: '41390', name: '시흥시', parent: '경기도' },
  { code: '41460', name: '용인시', parent: '경기도' },
  { code: '41590', name: '화성시', parent: '경기도' },
  { code: '41830', name: '파주시', parent: '경기도' },
  */
];

export const getRegionsByParent = (parentName: string): Region[] => {
  return regions.filter(region => region.parent === parentName);
};

export const getParentRegions = (): Region[] => {
  // parent가 비어있는 최상위 지역만 필터링 (서울특별시, 경기도 등)
  return regions.filter(region => !region.parent);
};

export const getRegionNameByCode = (code: string): string | undefined => {
  return regions.find(region => region.code === code)?.name;
};
