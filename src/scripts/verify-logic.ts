// src/scripts/verify-logic.ts
import { regions } from '../data/regions';

const sample = {
  aptNm: "삼전솔하임4차",
  dealAmount: "13,100", // 1.31억 -> 1.3억 기대
  excluUseAr: 15.09,    // 4.56평 -> 5평 기대
  dealYear: 2026,
  dealMonth: 1,
  dealDay: 31,
  sggCd: "11110"
};

function verify() {
  console.log("=== [원본 데이터] ===");
  console.log(`아파트: ${sample.aptNm}`);
  console.log(`금액: ${sample.dealAmount} 만원`);
  console.log(`면적: ${sample.excluUseAr} ㎡`);

  // 1. 거래가격 (억 단위, 소수점 첫째자리 반올림)
  const amountNum = parseInt(sample.dealAmount.replace(/,/g, ''));
  const amountBillionRaw = amountNum / 10000;
  const amountBillion = Math.round(amountBillionRaw * 10) / 10;

  // 2. 면적 (평 단위, 정수)
  const areaPyeong = Math.round(sample.excluUseAr / 3.3058);

  // 3. 평당가격 (억 단위, 소수점 첫째자리 반올림)
  const areaPyeongRaw = sample.excluUseAr / 3.3058;
  const pricePerPyeongRaw = amountBillionRaw / areaPyeongRaw;
  const pricePerPyeong = Math.round(pricePerPyeongRaw * 10) / 10;

  // 4. 날짜 문자열 (YYYY-MM-DD)
  const dateStr = `${sample.dealYear}-${String(sample.dealMonth).padStart(2, '0')}-${String(sample.dealDay).padStart(2, '0')}`;

  // 5. 지역명 매핑
  const region = regions.find(r => r.code === sample.sggCd);
  const regionName = region ? region.name : "알 수 없음";

  console.log("\n=== [변환 후 데이터 (소수점 첫째자리 반올림)] ===");
  console.log(`아파트: ${sample.aptNm}`);
  console.log(`거래가격: ${amountBillion.toFixed(1)} 억 (1.31 -> 1.3)`);
  console.log(`면적: ${areaPyeong} 평 (정수)`);
  console.log(`평당가격: ${pricePerPyeong.toFixed(1)} 억 (0.287... -> 0.3)`);
  console.log(`거래날짜: ${dateStr}`);
  console.log(`지역명: ${regionName}`);
  
  console.log("\n=== [검증 결과] ===");
  console.log(`- 가격(억) 형식: ${amountBillion === 1.3 ? '✅ 통과' : '❌ 실패'} (${amountBillion}억)`);
  console.log(`- 평당가(억) 형식: ${pricePerPyeong === 0.3 ? '✅ 통과' : '❌ 실패'} (${pricePerPyeong}억)`);
  console.log(`- 면적(평) 정수화: ${areaPyeong === 5 ? '✅ 통과' : '❌ 실패'} (${areaPyeong}평)`);
}

verify();
