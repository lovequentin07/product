// src/types/real-estate.ts

export interface TransactionRequest {
  LAWD_CD: string; // 지역코드 (예: 11110)
  DEAL_YMD: string; // 계약월 (예: 202402)
  serviceKey?: string; // API 인증키
  [key: string]: string | number | undefined; // Allow for additional properties for generic API calls
}

export interface TransactionResponse {
  resultCode: string;
  resultMsg: string;
  items: TransactionItem[];
  pageNo?: number;
  totalCount?: number;
}

export interface TransactionItem {
  거래금액: string; // 예: "82,500" (만원 단위, 쉼표 포함 문자열)
  건축년도: number;
  년: number;
  월: number;
  일: number;
  법정동: string; // 예: "사직동"
  아파트: string; // 아파트명
  전용면적: number;
  지번: string;
  지역코드: string;
  층: number;
  해제사유발생일?: string; // 계약 해제 여부 확인용
  등기일자?: string;
  도로명?: string; // 예: "사직로8길"
  도로명건물본번코드?: string;
  도로명건물부번코드?: string;
  도로명시군구코드?: string;
  도로명일련번호코드?: string;
  도로명지상지하코드?: string;
  도로명코드?: string;
  법정동본번코드?: string;
  법정동부번코드?: string;
  법정동시군구코드?: string;
  법정동읍면동코드?: string;
  법정동지번코드?: string;
  일련번호?: string;
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
