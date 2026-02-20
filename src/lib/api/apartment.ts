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
 * @param perPage 한 페이지 결과 수 (기본값 1000, 최대 1000)
 * @returns 정규화된 아파트 실거래가 목록과 페이지네이션 메타데이터 또는 null (에러 발생 시)
 */
export async function getApartmentTransactions(
  lawdCd: string,
  dealYmd: string,
  perPage: number = 1000 // 한 페이지에 가져올 최대 건수 (API 최대가 1000으로 가정)
): Promise<ApartmentTransactionsResult | null> {
  let allTransactions: NormalizedTransaction[] = [];
  let currentPage = 1;
  let hasMore = true;
  let totalCount = 0;

  while (hasMore) {
    const params: TransactionRequest = {
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      numOfRows: perPage,
      pageNo: currentPage,
    };

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number>;

    try {
      const response: TransactionResponse & { response?: { body?: { totalCount?: number } } } = await callPublicDataApi(APARTMENT_TRADE_API_PATH, filteredParams);

      const items: TransactionItem[] = response?.response?.body?.items?.item || [];
      totalCount = response?.response?.body?.totalCount || 0; // 최신 totalCount 업데이트

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false; // 더 이상 데이터 없음
        if (currentPage === 1 && totalCount > 0) {
           // totalCount는 있는데 items가 없는 경우 (API 오류 또는 마지막 페이지 처리 문제)
          console.warn(`API: totalCount ${totalCount}인데 items가 없습니다. LAWD_CD: ${lawdCd}, DEAL_YMD: ${dealYmd}, pageNo: ${currentPage}`);
        }
      } else {
        const normalizedData: NormalizedTransaction[] = items.map((item: TransactionItem, index: number) => {
          const price = parseInt(String(item.dealAmount).replace(/,/g, ''), 10);
          const dealDate = `${item.dealYear}-${String(item.dealMonth).padStart(2, '0')}-${String(item.dealDay).padStart(2, '0')}`;
          const address = `${item.umdNm || ''} ${item.jibun || ''}`.trim();

          return {
            id: `${lawdCd}-${dealYmd}-${currentPage}-${index}`, // 각 거래 고유 ID 생성 (페이지 및 인덱스 포함)
            aptName: item.aptNm || '정보 없음',
            price: isNaN(price) ? 0 : price,
            area: item.excluUseAr || 0,
            date: dealDate,
            address: address,
            floor: item.floor || 0,
            buildYear: item.buildYear || 0,
            isCancelled: !!item.cdealDay,
          };
        });
        allTransactions = allTransactions.concat(normalizedData);
        
        // 다음 페이지가 있는지 확인
        if (allTransactions.length < totalCount) {
          currentPage++;
        } else {
          hasMore = false;
        }
      }

    } catch (error) {
      console.error('Error fetching apartment transactions:', error);
      return null;
    }
  }

  return {
    transactions: allTransactions,
    totalCount: totalCount,
    pageNo: currentPage, // 마지막으로 조회한 페이지 번호
    numOfRows: perPage,
  };
}

interface RawApartmentTransactionsResult {
  transactions: TransactionItem[];
  totalCount: number;
}

/**
 * 아파트 실거래가 원천 데이터를 공공데이터포털에서 가져옵니다. (정규화 없음)
 */
export async function getRawApartmentTransactions(
  lawdCd: string,
  dealYmd: string,
  perPage: number = 1000
): Promise<RawApartmentTransactionsResult | null> {
  let allTransactions: TransactionItem[] = [];
  let currentPage = 1;
  let hasMore = true;
  let totalCount = 0;

  while (hasMore) {
    const params: TransactionRequest = {
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      numOfRows: perPage,
      pageNo: currentPage,
    };

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number>;

    try {
      const response: TransactionResponse = await callPublicDataApi(APARTMENT_TRADE_API_PATH, filteredParams);

      const items: TransactionItem[] = response?.response?.body?.items?.item || [];
      totalCount = response?.response?.body?.totalCount || 0;

      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false;
      } else {
        allTransactions = allTransactions.concat(items);
        
        if (allTransactions.length < totalCount) {
          currentPage++;
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error fetching raw apartment transactions:', error);
      return null;
    }
  }

  return {
    transactions: allTransactions,
    totalCount: totalCount,
  };
}
