// src/types/real-estate.ts

export interface TransactionRequest {
  LAWD_CD: string; // 지역코드 (예: 11110)
  DEAL_YMD: string; // 계약월 (예: 202402)
  numOfRows?: number; // 한 페이지 결과 수
  pageNo?: number; // 페이지 번호
  [key: string]: string | number | undefined; // Add index signature
}

export interface TransactionResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: TransactionItem[]; // It can be an array due to parseXmlResponse isArray option
      };
      totalCount: number;
      pageNo: number;
      numOfRows: number;
    };
  };
}

export interface TransactionItem {
  dealAmount: string; // 예: "145,000" (만원 단위, 쉼표 포함 문자열)
  buildYear: number;
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  umdNm: string; // 예: "거여동" (법정동명)
  umdCd?: string; // 법정동읍면동코드
  aptNm: string; // 아파트명 (예: "현대1차")
  excluUseAr: number; // 전용면적
  jibun: string; // 지번
  sggCd: string; // 시군구코드 (지역코드)
  floor: number;
  cdealDay?: string; // 계약 해제일 (Cancel Deal Day)
  cdealType?: string; // 계약 해제 유형
  aptDong?: string; // 아파트 법정동
  aptSeq?: string; // 아파트 일련번호
  bonbun?: string | number; // 본번 (문자열 또는 숫자)
  bubun?: string | number; // 부번 (문자열 또는 숫자)
  buyerGbn?: string; // 매수자 구분
  dealingGbn?: string; // 거래 유형
  estateAgentSggNm?: string; // 공인중개사 시군구명
  landCd?: string | number; // 토지코드
  landLeaseholdGbn?: string; // 토지임대구분
  rgstDate?: string; // 등기일자
  roadNm?: string; // 도로명
  roadNmBonbun?: number; // 도로명 본번
  roadNmBubun?: number; // 도로명 부번
  roadNmCd?: number; // 도로명 코드
  roadNmSeq?: number; // 도로명 일련번호 코드
  roadNmSggCd?: number; // 도로명 시군구 코드
  roadNmbCd?: number; // 도로명 건물 본번 코드
  slerGbn?: string; // 매도자 구분
}

export interface NormalizedTransaction {
  id: string; // 고유 식별자 (생성)
  aptName: string;
  price: number; // 만원 단위 숫자 (쉼표 제거됨)
  area: number; // 전용면적
  date: string; // YYYY-MM-DD 형식
  address: string; // 법정동 + 지번
  floor: number;
  buildYear: number;
  isCancelled: boolean; // 해제 여부
}
