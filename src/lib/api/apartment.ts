// src/lib/api/apartment.ts

import { callPublicDataApi } from './client';
import { TransactionItem, NormalizedTransaction, TransactionRequest, TransactionResponse } from '@/types/real-estate'; // Import TransactionResponse

const APARTMENT_TRADE_API_PATH = '/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

interface ApartmentTransactionsResult {
  transactions: NormalizedTransaction[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}

/**
 * 아파트 실거래가 데이터를 공공데이터포털에서 가져와 정규화합니다.
 * @param lawdCd 법정동 코드 (예: 11110)
 * @param dealYmd 계약월 (예: 202402)
 * @param numOfRows 한 페이지 결과 수 (기본값 100)
 * @param pageNo 페이지 번호 (기본값 1)
 * @returns 정규화된 아파트 실거래가 목록과 페이지네이션 메타데이터 또는 null (에러 발생 시)
 */
export async function getApartmentTransactions(
  lawdCd: string,
  dealYmd: string,
  numOfRows: number = 15, // 기본값 15개
  pageNo: number = 1 // 기본값 1페이지
): Promise<ApartmentTransactionsResult | null> {
  const params: TransactionRequest = {
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    numOfRows: numOfRows,
    pageNo: pageNo,
    // stdt는 현재 API 명세에 없지만, 추후 확장 가능성을 위해 남겨둠
    // stdt: dealYmd.substring(0, 4) // 예를 들어, stdt가 년도를 의미한다면 이렇게 사용
  };

  // Filter out undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number>;

  try {
    const response: TransactionResponse & { response?: { body?: { totalCount?: number } } } = await callPublicDataApi(APARTMENT_TRADE_API_PATH, filteredParams);

    // API 응답 구조에 따라 items 객체 접근 경로가 달라질 수 있음.
    // 여기서는 service.response.body.items.item 구조를 가정.
    const items: TransactionItem[] = response?.response?.body?.items?.item || [];
    const totalCount = response?.response?.body?.totalCount || 0;


    if (!Array.isArray(items) || items.length === 0) {
      console.log(`No data found for LAWD_CD: ${lawdCd}, DEAL_YMD: ${dealYmd}`);
      return { transactions: [], totalCount: totalCount, pageNo: pageNo, numOfRows: numOfRows };
    }

    // 데이터 정규화
    const normalizedData: NormalizedTransaction[] = items.map((item: TransactionItem, index: number) => {
      // 거래금액에서 쉼표 제거 및 숫자로 변환
      const price = parseInt(String(item.dealAmount).replace(/,/g, ''), 10);
      const dealDate = `${item.dealYear}-${String(item.dealMonth).padStart(2, '0')}-${String(item.dealDay).padStart(2, '0')}`;
      const address = `${item.umdNm || ''} ${item.jibun || ''}`.trim();

      return {
        id: `${lawdCd}-${dealYmd}-${pageNo}-${index}`, // 각 거래 고유 ID 생성 (페이지 및 인덱스 포함)
        aptName: item.aptNm || '정보 없음',
        price: isNaN(price) ? 0 : price, // 유효하지 않은 값은 0으로 처리
        area: item.excluUseAr || 0,
        date: dealDate,
        address: address,
        floor: item.floor || 0,
        buildYear: item.buildYear || 0,
        isCancelled: !!item.cdealDay, // cdealDay가 있으면 취소된 거래로 간주
      };
    });

    return {
      transactions: normalizedData,
      totalCount: totalCount,
      pageNo: pageNo,
      numOfRows: numOfRows,
    };
  } catch (error) {
    console.error('Error fetching apartment transactions:', error);
    return null;
  }
}
