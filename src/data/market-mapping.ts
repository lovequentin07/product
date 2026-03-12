// src/data/market-mapping.ts
// Auto-generated 2026-03-11. Run: npx tsx src/scripts/update-market-mapping.ts
// 전체 품목 수: 98개

export interface MarketMapping {
  item_cd: string
  item_nm: string
  ctgry_cd: string
  ctgry_nm: string
  vrty_cd: string
  grd_cd: string
  grd_nm: string
  unit: string
  unit_sz: string
  se_cd: string // 01=소매, 02=도매(소매 없는 경우)
  coverage: number // 최근 13개월 중 데이터 있는 달 수
}

// 키: item_cd (aT 가격 API 품목 코드)
export const MARKET_MAPPING: Record<string, MarketMapping> = {
  // [100] 식량작물
  '111': { item_cd: '111', item_nm: '쌀', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '10', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '10', se_cd: '01', coverage: 299 },
  '112': { item_cd: '112', item_nm: '찹쌀', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '114': { item_cd: '114', item_nm: '기장', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  '141': { item_cd: '141', item_nm: '콩', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '500', se_cd: '01', coverage: 295 },
  '142': { item_cd: '142', item_nm: '팥', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '500', se_cd: '01', coverage: 299 },
  '143': { item_cd: '143', item_nm: '녹두', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '500', se_cd: '01', coverage: 299 },
  '144': { item_cd: '144', item_nm: '메밀', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '01', grd_cd: '05', grd_nm: '중품', unit: 'kg', unit_sz: '1', se_cd: '02', coverage: 26 },
  '151': { item_cd: '151', item_nm: '고구마', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '152': { item_cd: '152', item_nm: '감자', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 246 },
  '161': { item_cd: '161', item_nm: '귀리', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  '162': { item_cd: '162', item_nm: '보리', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  '163': { item_cd: '163', item_nm: '수수', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  '164': { item_cd: '164', item_nm: '율무', ctgry_cd: '100', ctgry_nm: '식량작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  // [200] 채소류
  '211': { item_cd: '211', item_nm: '배추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '06', grd_cd: '04', grd_nm: '상품', unit: '포기', unit_sz: '1', se_cd: '01', coverage: 161 },
  '212': { item_cd: '212', item_nm: '양배추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: '포기', unit_sz: '1', se_cd: '01', coverage: 275 },
  '213': { item_cd: '213', item_nm: '시금치', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '214': { item_cd: '214', item_nm: '상추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '215': { item_cd: '215', item_nm: '얼갈이배추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 280 },
  '221': { item_cd: '221', item_nm: '수박', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 262 },
  '223': { item_cd: '223', item_nm: '오이', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 299 },
  '224': { item_cd: '224', item_nm: '호박', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 299 },
  '225': { item_cd: '225', item_nm: '토마토', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '226': { item_cd: '226', item_nm: '딸기', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 161 },
  '231': { item_cd: '231', item_nm: '무', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '06', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 166 },
  '232': { item_cd: '232', item_nm: '당근', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '233': { item_cd: '233', item_nm: '열무', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 269 },
  '241': { item_cd: '241', item_nm: '건고추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '600', se_cd: '01', coverage: 235 },
  '242': { item_cd: '242', item_nm: '풋고추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 230 },
  '243': { item_cd: '243', item_nm: '붉은고추', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '244': { item_cd: '244', item_nm: '피마늘', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '22', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '10', se_cd: '02', coverage: 48 },
  '245': { item_cd: '245', item_nm: '양파', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '246': { item_cd: '246', item_nm: '파', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '247': { item_cd: '247', item_nm: '생강', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '252': { item_cd: '252', item_nm: '미나리', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '253': { item_cd: '253', item_nm: '깻잎', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '255': { item_cd: '255', item_nm: '피망', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 294 },
  '256': { item_cd: '256', item_nm: '파프리카', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '200', se_cd: '01', coverage: 299 },
  '257': { item_cd: '257', item_nm: '멜론', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 276 },
  '258': { item_cd: '258', item_nm: '깐마늘(국산)', ctgry_cd: '200', ctgry_nm: '채소류', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  // [300] 특용작물
  '312': { item_cd: '312', item_nm: '참깨', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '500', se_cd: '01', coverage: 195 },
  '313': { item_cd: '313', item_nm: '들깨', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '23', se_cd: '02', coverage: 65 },
  '314': { item_cd: '314', item_nm: '땅콩', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '02', grd_cd: '05', grd_nm: '중품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '315': { item_cd: '315', item_nm: '느타리버섯', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 286 },
  '316': { item_cd: '316', item_nm: '팽이버섯', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '150', se_cd: '01', coverage: 299 },
  '317': { item_cd: '317', item_nm: '새송이버섯', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 289 },
  '318': { item_cd: '318', item_nm: '호두', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '319': { item_cd: '319', item_nm: '아몬드', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '321': { item_cd: '321', item_nm: '양송이버섯', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  '322': { item_cd: '322', item_nm: '표고버섯', ctgry_cd: '300', ctgry_nm: '특용작물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  // [400] 과일류
  '411': { item_cd: '411', item_nm: '사과', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '05', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 270 },
  '412': { item_cd: '412', item_nm: '배', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 290 },
  '414': { item_cd: '414', item_nm: '포도', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '12', grd_cd: '24', grd_nm: 'L과', unit: 'kg', unit_sz: '2', se_cd: '01', coverage: 252 },
  '415': { item_cd: '415', item_nm: '감귤', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '02', grd_cd: '15', grd_nm: 'M과', unit: '개', unit_sz: '10', se_cd: '01', coverage: 171 },
  '416': { item_cd: '416', item_nm: '단감', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 194 },
  '418': { item_cd: '418', item_nm: '바나나', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 283 },
  '419': { item_cd: '419', item_nm: '참다래', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 190 },
  '420': { item_cd: '420', item_nm: '파인애플', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 260 },
  '421': { item_cd: '421', item_nm: '오렌지', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '03', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 131 },
  '424': { item_cd: '424', item_nm: '레몬', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '10', se_cd: '01', coverage: 253 },
  '425': { item_cd: '425', item_nm: '체리', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 219 },
  '428': { item_cd: '428', item_nm: '망고', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 258 },
  '430': { item_cd: '430', item_nm: '아보카도', ctgry_cd: '400', ctgry_nm: '과일류', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 248 },
  // [500] 축산물
  '515': { item_cd: '515', item_nm: '닭고기', ctgry_cd: '500', ctgry_nm: '축산물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  '516': { item_cd: '516', item_nm: '계란', ctgry_cd: '500', ctgry_nm: '축산물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
  // [600] 수산물
  '611': { item_cd: '611', item_nm: '고등어', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '05', grd_cd: '20', grd_nm: '大', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 243 },
  '612': { item_cd: '612', item_nm: '꽁치', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '05', grd_nm: '중품', unit: '마리', unit_sz: '5', se_cd: '01', coverage: 266 },
  '613': { item_cd: '613', item_nm: '갈치', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '03', grd_cd: '21', grd_nm: '中', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 242 },
  '614': { item_cd: '614', item_nm: '조기', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '07', grd_cd: '21', grd_nm: '中', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 228 },
  '615': { item_cd: '615', item_nm: '명태', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '04', grd_cd: '20', grd_nm: '大', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 247 },
  '616': { item_cd: '616', item_nm: '삼치', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '20', grd_nm: '大', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 185 },
  '619': { item_cd: '619', item_nm: '물오징어', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '05', grd_cd: '21', grd_nm: '中', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 277 },
  '638': { item_cd: '638', item_nm: '마른멸치', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '28', grd_nm: '중멸', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '639': { item_cd: '639', item_nm: '북어', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '05', grd_nm: '중품', unit: '마리', unit_sz: '10', se_cd: '02', coverage: 65 },
  '640': { item_cd: '640', item_nm: '마른오징어', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: '마리', unit_sz: '10', se_cd: '01', coverage: 299 },
  '641': { item_cd: '641', item_nm: '김', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '05', grd_nm: '중품', unit: '장', unit_sz: '10', se_cd: '01', coverage: 299 },
  '642': { item_cd: '642', item_nm: '마른미역', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '644': { item_cd: '644', item_nm: '굴', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 175 },
  '649': { item_cd: '649', item_nm: '수입조기', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '04', grd_cd: '05', grd_nm: '중품', unit: '마리', unit_sz: '1', se_cd: '01', coverage: 194 },
  '650': { item_cd: '650', item_nm: '새우젓', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '651': { item_cd: '651', item_nm: '멸치액젓', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 299 },
  '652': { item_cd: '652', item_nm: '천일염', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '5', se_cd: '01', coverage: 299 },
  '653': { item_cd: '653', item_nm: '전복', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: '마리', unit_sz: '5', se_cd: '01', coverage: 272 },
  '654': { item_cd: '654', item_nm: '새우', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '05', grd_nm: '중품', unit: '마리', unit_sz: '10', se_cd: '01', coverage: 277 },
  '656': { item_cd: '656', item_nm: '꽃게', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '02', grd_cd: '05', grd_nm: '중품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 204 },
  '658': { item_cd: '658', item_nm: '홍합', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 284 },
  '659': { item_cd: '659', item_nm: '가리비', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 196 },
  '660': { item_cd: '660', item_nm: '건다시마', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: 'g', unit_sz: '100', se_cd: '01', coverage: 299 },
  '661': { item_cd: '661', item_nm: '바지락', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 238 },
  '662': { item_cd: '662', item_nm: '고등어필렛', ctgry_cd: '600', ctgry_nm: '수산물', vrty_cd: '00', grd_cd: '05', grd_nm: '중품', unit: 'kg', unit_sz: '1', se_cd: '01', coverage: 239 },
  // [800] 식품
  '811': { item_cd: '811', item_nm: '즉석밥', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '묶음', unit_sz: '1', se_cd: '01', coverage: 286 },
  '812': { item_cd: '812', item_nm: '두부', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 285 },
  '813': { item_cd: '813', item_nm: '김치', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '02', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 264 },
  '814': { item_cd: '814', item_nm: '고추장', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 286 },
  '815': { item_cd: '815', item_nm: '된장', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 286 },
  '816': { item_cd: '816', item_nm: '간장', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '개', unit_sz: '1', se_cd: '01', coverage: 286 },
  '817': { item_cd: '817', item_nm: '맛김(조미김)', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '묶음', unit_sz: '1', se_cd: '01', coverage: 245 },
  '818': { item_cd: '818', item_nm: '콩나물', ctgry_cd: '800', ctgry_nm: '식품', vrty_cd: '01', grd_cd: '04', grd_nm: '상품', unit: '봉', unit_sz: '1', se_cd: '01', coverage: 286 },
  // [900] 임산물
  '912': { item_cd: '912', item_nm: '밤', ctgry_cd: '900', ctgry_nm: '임산물', vrty_cd: '', grd_cd: '', grd_nm: '', unit: '', unit_sz: '', se_cd: '', coverage: 0 },
}
